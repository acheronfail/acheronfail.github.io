// https://8325.org/haiku/
const netPositiveErrorMessages = [
  `The web site you seek
Lies beyond our perception
But others await.`,
  `Sites you are seeking
From your path they are fleeing
Their winter has come.`,
  `A truth found, be told
You are far from the fold, Go
Come back yet again.`,
  `Wind catches lily
Scatt'ring petals to the wind:
Your site is not found.`,
  `These three are certain:
Death, taxes, and site not found.
You, victim of one.`,
  `Ephemeral site.
I am the Blue Screen of Death.
No one hears your screams.`,
  `Aborted effort:
The site, passed this veil of tears.
You ask way too much.`,
  `Mourning and sorrow
404 not with us now
Lost to paradise.`,
  `Not a pretty sight
When the web dies screaming loud
The site is not found.`,
  `Site slips through fingers
Pulse pounding hard and frantic
Vanishing like mist.`,
  `The dream is shattered
The web site cannot be found
Inside the spring rain.`,
  `Bartender yells loud
Your site cannot be found, boy
Buy another drink.`,
  `Chrome megaphone barks
It's not possible to talk
Not yet anyway.`,
  `Emptyness of soul
Forever aching blackness:
"Blah.com not found."`,
  `Click exciting link
Gossamer threads hold you back
404 not found.`,
  `With searching comes loss
And the presence of absence:
The site is not found.`,
  `You step in the stream,
But the water has moved on
The site is not here.`,
  `Rather than a beep
Or a rude error message,
These words: 'Site not found.'`,
  `Something you entered
Transcended parameters.
The site is unknown.`,
  `Stay the patient course
Of little worth is your ire
The server is down`,
  `There is a chasm
Of carbon and silicon
The server can't bridge.`,
  `Chaos reigns within.
Reflect, repent, and retry.
Server shall return.`,
  `Won't you please observe
A brief moment of silence
For the dead server?`,
  `First snow, then silence.
This expensive server dies
So beautifully.`,
  `Seeing my great fault
Through darkening dead servers
I begin again.`,
  `Visit the home page
It can't be done easily
When the site is down.`,
  `Cables have been cut
Southwest of Northeast somewhere
We are not amused.`,
  `Site is silent, yes
No voices can be heard now
The cows roll their eyes.`,
  `Silicon shudders
The site is down for the count
One big knockout punch.`,
  `Yesterday it worked
Today it is not working
The web is like that.`,
  `The ten thousand things
How long do any persist?
The file, not there.`,
  `A file that big?
It might be very useful
But now it is gone.`,
  `To have no errors
Would be life without meaning
No struggle, no joy`,
  `Errors have occurred.
We won't tell you where or why.
Lazy programmers.`,
  `The code was willing
It considered your request,
But the chips were weak.`,
  `Error reduces
Your expensive computer
To a simple stone.`,
  `Server's poor response
Not quick enough for browser.
Timed out, plum blossom.`,
  `Login incorrect.
Only perfect spellers may
Enter this system.`,
];

const el = document.getElementById('_404');
el.textContent = netPositiveErrorMessages[Math.floor(Math.random() * netPositiveErrorMessages.length)];
