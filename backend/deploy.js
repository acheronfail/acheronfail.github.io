import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { readdir, rm } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import esbuild from 'esbuild';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, 'dist');

/**
 * Bundle lambda code
 */

const re = /^lambda-(.+)\.ts$/;
const entries = await readdir(here);
const entryPoints = Object.fromEntries(
  entries.filter((n) => re.test(n)).map((n) => [n.replace(re, (_, $1) => $1), join(here, n)])
);
await rm(dist, { force: true, recursive: true });
await esbuild.build({
  entryPoints,
  outdir: dist,
  bundle: true,
  format: 'esm',
  target: 'node18',
  platform: 'node',
  outExtension: { '.js': '.mjs' },
  sourcemap: 'external',
  banner: {
    // Fixes esbuild issue with CommonJS modules
    js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);",
  },
});

/**
 * Pulumi deploy
 */

// define an IAM role that will be used by the Lambda Function
const lambdaRole = new aws.iam.Role('lambda_role', {
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'sts:AssumeRole',
        Effect: 'Allow',
        Principal: {
          Service: 'lambda.amazonaws.com',
        },
      },
    ],
  }),
});

// attach the AWSLambdaBasicExecutionRole so that the function can write logs to CloudWatch
new aws.iam.RolePolicyAttachment('lambda_role_policy_attachment', {
  role: lambdaRole,
  policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole,
});

// define the Lambda Functions
const code = new pulumi.asset.AssetArchive({ '.': new pulumi.asset.FileArchive(dist) });
const lambdaFunctions = Object.keys(entryPoints).map((name) => {
  const lambdaFunction = new aws.lambda.Function(`lambda_${name}`, {
    code,
    timeout: 10,
    role: lambdaRole.arn,
    runtime: 'nodejs18.x',
    handler: `${name}.handler`,
  });

  return {
    lambdaArn: lambdaFunction.arn,
  };
});

const myApi = new aws.apigateway.RestApi("myApi", {
  description: "API Gateway for streaming Lambda responses",
});

// Create a resource within the API Gateway
const myResource = new aws.apigateway.Resource("myResource", {
  restApi: myApi.id,
  parentId: myApi.rootResourceId,
  pathPart: "stream",
});

// Define the Lambda integration, you handle the response as a stream in your Lambda code.
const myIntegration = new aws.apigateway.Integration("myIntegration", {
  restApi: myApi.id,
  resourceId: myResource.id,
  httpMethod: "GET",
  integrationHttpMethod: "POST", // Lambda's underlying invoke call is always POST
  type: "AWS_PROXY", // AWS_PROXY indicates that we want to integrate the API Gateway directly with Lambda.
  uri: myLambdaFunction.invokeArn,
});

// Define the method for the resource
const myMethod = new aws.apigateway.Method("myMethod", {
  restApi: myApi.id,
  resourceId: myResource.id,
  httpMethod: "GET",
  authorization: "NONE", // Assuming public access, could use AWS_IAM for restricted access
  integration: myIntegration,
});

// Define an API Gateway deployment to make the API live
const myDeployment = new aws.apigateway.Deployment("myDeployment", {
  restApi: myApi.id,
  // Specify other configuration if necessary
}, { dependsOn: [myMethod] }); // Make sure to create the deployment after the method.

// Expose the endpoint so we can call it
export const apiUrl = pulumi.interpolate`${myApi.executionArn}/${myResource.path}`;
