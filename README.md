parallac.js
=

A Distributed Computing library written for Node.js.

Parallac.js takes a different view of microservices by allowing you to write programs which distribute themselves at runtime on "host" servers.  This allows you to treat a collection of servers (locales) as a single computing resource.  With Parallac.js, one can think in terms of allocating memory "over there" and running code "over there".  No deploys are necessary to run a new program, you simply run your program which then executes on the available host servers.

Node.js (and Javascript ES6) is an important part of this prototype because it has the flexibility that makes Parallac.js possible.  For example, Lambda functions are effectively remoted and evaulated in remote VMs.  VM contexts can be managed by the parallac program to effectively provide custom runtime contexts.  The Inter-server communication is done via socket.io.

Acknowledgement: This library is heavily based on the concepts of the Chapel Language (https://github.com/chapel-lang).  I have spent a lot of time writing in Chapel and the concepts are really interesting and powerful.  Parallac.js is an experiment in how to bring those concepts to Node.  (I would have called it Chapel.js but that's probably not doing Chapel any justice.)  Go checkout Chapel (http://chapel.cray.com) if you want to see the real deal.

Concepts
=

Locales
-

A Locale is an execution context that contains both memory and processing resources.  A typcal distributed computing environment has many locales and programs running in these environments distribute work and memory usage across locales.

Typically in the unit of a machine, a locale, in SOA nomenclature, can loosely be translated to a service.  However, in parallac.js, a locale is actually more like an ephemeral vm that remotely runs your code.  The system takes care of communication between locales and you write your program largely thinking of locales in an abstract sense.

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

The behavior of writeln is basically a "remote" console.log, in that all writeln output is sent back to the client where a local console.log is used to print the output.

The 'on' keyword tells the system to run the specified function on the specified locale.  The system effectively moves the code to the locale, executes it in the current VM session and then marshals back any results.

Try it!
-

start the Parallac cluster (servers):
--

server 1
---
    $ cd server
    $ PARALLAC_HERE=http://localhost:3000 PARALLAC_SERVERS=http://localhost:3000,http://localhost:3001 node server.js

server 2
---
    $ cd server
    $ PARALLAC_HERE=http://localhost:3001 PARALLAC_SERVERS=http://localhost:3000,http://localhost:3001 node server.js

run the code on the Parallac cluster:
--
    $ cd examples
    $ PARALLAC_SERVERS=http://localhost:3000,http://localhost:3001 node hello
    0: hello from locale 0
    1: hello from locale 1


Test
=

npm test