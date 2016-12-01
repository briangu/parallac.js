parallac.js
=

A Distributed Computing library written for Node.js based on Chapel (http://chapel.cray.com).

Parallac.js creates a set of primitives that allow for data and task parallelism over a cluster of Node.js servers.  Generally, Parallac.js takes a different view of microservices by allowing you to write programs which distribute themselves at runtime to "host" servers.  This allows you to treat a collection of servers (locales) as a single, possibly multi-tenant, computing resource.  With Parallac.js, one can think in terms of "remote lambda" execution, allocating memory "over there" and running code "over there".  Once the host servers are deployed, no additional deploys are necessary to run a new program.  You simply run your program locally and it connects to the cluster, which then executes on the available host servers.

Node.js (and Javascript ES6) is an important part of this prototype because it has the flexibility that makes Parallac.js possible.  For example, Lambda functions are effectively remoted and evaulated in remote Node VMs.  VM contexts can be managed by the Parallac program to effectively provide custom runtime contexts.  The Inter-server communication is done via a graph of socket.io connections.

Acknowledgement: Parallac.js is heavily based on the concepts of the Chapel Language (https://github.com/chapel-lang).  I have spent a lot of time writing Chapel (and presenting at conferences) and the concepts are really interesting and powerful.  Parallac.js is an experiment in how to bring those concepts to Node.  Node.js is also very powerful but for an entirely different application, so bringing these concepts together is interesting.  (I would have called it Chapel.js but that's probably not doing Chapel any justice.)  Go checkout Chapel (http://chapel.cray.com) if you want to see the real deal.

Application ideas
=

* Distributed web-based applications
* Distributed memory applications
* Rapid prototyping for IoT devices
* A different take on serverless computing
* A different take on microservices
* Computation (using data and task parallelism)

Concepts
=

For a thorough introduction, it is highly recommended to check out the Chapel concepts: http://chapel.cray.com/learning.html

Locales
-

A Locale is an execution context that contains both memory and processing resources.  A typcal distributed computing environment has many locales and programs running in these environments distribute work and memory usage across locales.

Typically in the unit of a machine, a locale, in SOA nomenclature, can loosely be translated to a service.  However, in parallac.js, a locale is actually more like an ephemeral vm that remotely runs your code.  The system takes care of communication between locales and you write your program largely thinking of locales in an abstract sense.

Domains
-

A Domain is the primary way of describe how memory is distributed over a set of Locales.  Unlike most languages, domains give you the ability to decouple the indices from a data structure, allowing for the ability associate indices with Locales as well as control how the indices are enumerated.

When creating a distributed array, for example, first we create the domain and then assign the domain to the distributed array.  In order to ensure that multiple distributed arrays share the same indices and Locales, we can simply create the arrays using the same shared domain.

Here we create a 1-D domain with 16 elements.  We then create two distributed arrays using the same domain:

    return createDomain(Locales, 16)
      .then((dom) => {
        let a = createDistArray(dom)
        let b = createDistArray(dom)
        return Promise.all([a, b])
      })

Examples
=

Hello, World!
-

The following program executes a writeln (distributed console.log) on each locale and prints the locale id on each locale:

    run(() => Locales.map((locale) => on(locale).do(() => writeln("hello from locale", here.id))))

Assuming there are 4 locales available to run on, the expected output is

    0: hello from locale 0
    1: hello from locale 1
    2: hello from locale 2
    3: hello from locale 3

What's going on here?  The first column tells you which locale the writeln happened on and each locale reported it's locale id using writeln.

There are a few things to consider here:

The function "run" is a helper that sets up the Parallac environment, runs the lambda function, and then returns a Promise that represents the computational result.

    run(...)

The inner lambda function executes in a Parallac runtime context (typically on a remote machine).  There are a few default globals that are available for use.  The global Locales is an array of Locale instances that represents all Locales across the Parallac cluster.  Here, we enumerate all Locales.

    () => Locales.map((locale) => ... ))

In order to run code an a Locale, we utilize the "on" function which is in the default global context.  Calling on(locale) indicates "run the function sent to 'do' on this locale".  Internally, the 'on' keyword tells the system to move the code to the specified locale, execute it in the current VM session and then marshals back any results.

    on(locale).do(...)

Finally, the code we execute on each locale is our "Hello, World!".  Here, we use writeln to "remote console.log" the phrase "hello from locale <locale id>".  The 'here' variable is available in the default global context and represent the locale that this code is running on.

    () => writeln("hello from locale", here.id)

As mentioned, the behavior of writeln is basically a "remote" console.log, in that all writeln output is sent back to the client where a local console.log is used to print the output.  In this way, you can write code as if it were running locally and the console output will be marshaled back for you.

Try it!
-

Start the Parallac cluster (the easy way) (assuming OSX/Bash)
--

    $ # deploy 4 servers, locales 0,1,2,3.
    $ source bin/deploy.sh 4

Run the code on the Parallac cluster:
--

We tell the client application where the PARALLAC_SERVERS are and run 'hello'

    $ cd examples
    $ node hello
    0: hello from locale 0
    1: hello from locale 1
    2: hello from locale 2
    3: hello from locale 3

    $ node addition
    a = 1; a + 1 => [ 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2 ]

    $ node matrix
	0	1	2	3	4	5	6	7
	8	9	10	11	12	13	14	15
	16	17	18	19	20	21	22	23
	24	25	26	27	28	29	30	31
	32	33	34	35	36	37	38	39
	40	41	42	43	44	45	46	47
	48	49	50	51	52	53	54	55
	56	57	58	59	60	61	62	63

Stop the servers
--

    $ ./bin/shutdown.sh

Prerequisites
--
    * install node.js (https://nodejs.org)
    * git clone https://github.com/briangu/parallac.js.git
    * cd parallac.js
    * npm install

Start the Parallac cluster (servers): (the hard way)
--

There are two environment variables that configure services:

* PARALLAC_SERVERS is a comma separated list of URIs of Parallac servers
* PARALLAC_HERE is a URI indicating which of the PARALLAC_SERVERS entries is this locale (here)

Server 1
---
    $ source bin/setenv.sh
    PARALLAC_SERVERS=http://localhost:3000,http://localhost:3001
    $ cd server
    $ node server.js http://localhost:3000

Server 2
---
    $ source bin/setenv.sh
    PARALLAC_SERVERS=http://localhost:3000,http://localhost:3001
    $ cd server
    $ node server.js http://localhost:3001

License
=

MIT

Test
=

npm test