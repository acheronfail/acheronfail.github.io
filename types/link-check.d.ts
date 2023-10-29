declare module 'link-check' {
  interface LinkCheckResult {
    statusCode: number;
    status: 'alive' | 'dead';
    err: Error | null;
    link: string;
  }

  function LinkCheck(url: string, callback: (err: Error | null, result: LinkCheckResult) => void): void;
  export default LinkCheck;
}
