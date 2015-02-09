Time Buddy
==========

This is Time Buddy project. It's goal is to allow the Users to create multiple clocks in different timezones.

Technological stack
-------------------

*   AngularJS
*   REST API with Spring MVC
*   Custom simple Security Layer
*   Spring Data for JPA
*   H2 database
*   JUnit + Mockito for testing
*   Maven

Requirements
------------

To run this applications, you'll need:

*   Java 6 SDK
*   Node.js
*   Maven

Build instructions
------------------

This code is committed with UI dist already build. If you want to rebuild UI, read the "Build UI dist" paragraph.
 
To build the code and run applications, you'll have to run Maven:

> $ mvn install

This will build war file, but you can run it using tomcat7:run plugin:

> $ mvn tomcat7:run

Application will be available under [http://localhost:8090/](http://localhost:8090/).


Build UI dist
-------------

If you want to build dist folder for the UI, you have to:
 
> $ npm install
> $ npm install gulp -g

And 
> $ gulp 

Further feedback
----------------

In case of any questions, you can reach me by email: adam [dot] nowaczyk [at] gmail [dot] com
