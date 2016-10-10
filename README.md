parallac.js
=

Experimental Distributed Computing library written for Node.JS

This library is heavily based on the concepts of the Chapel Language, and for the most part is an experiment in how to bring those concepts to Node.  I would have called it ChapelJS but that's probably not doing Chapel any justice.  Go checkout Chapel (http://chapel.cray.com) if you want to see the real deal.

Concepts
=

Locales
-

A Locale is an execution context that contains both memory and processing resources.  A typcal distributed computing environment has many locales and programs running in these environments distribute work and memory usage across locales.

Typically in the unit of a machine, a locale, in SOA nomenclature, can loosely be translated to a service.  However, in parallac.js, a locale is actually more like an ephemeral vm that remotely runs your code.  The system takes care of communication between locales and you write your program largely thinking of locales in an abstract sense.

Examples
=

The following program executes a console.log on each locale and prints the locale id:

    parallac.run(() => {
      for (let locale of Locales) {
        on(locale).do(() => console.log("hello from locale", here.id))
      }
    })


The 'on' keyword tells the system to run the following function on the specified locale.  The system effectively moves the code to the locale, executes it in the current VM session and then marshals back any results.



