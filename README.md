##Mozmill CI Configuration Generator

#Overview
Mozmill CI Configuration Generator is an application that intends to generate valid configuration files for Mozmill CI on-demand jobs, in order to reduce the chance of human error.

#Help
* Testruns: Pick a testrun type and a dashboard, from Testrun section. For update testruns you have to either pick a target version or to give a target build ID.
* Builds: Under the "Builds" section you can chose the platforms on winch the jobs will be ran, also the Firefox version and the localization of the Firefox. To add a platform hit the "Add a platform" button under the builds section, to remove a platform hit "Remove platform" button  on the right of the job. You can add multiple Firefox versions for each platform, and you can't add the same platform twice.
* Document: At the end of the page you have the resulted configuration file, please hit the "Check All Builds" button before copying the text, so the application will check the builds and the target build ID for update testruns.
* Logger: all the errors or success messages will be displayed under the "Logger" section, to see older logs hit the "See all history" button at the top of the page.

#Requirements
*  Logger should be separate from the notifications and simply keep a full log in a scrollable list with the latest at the top. It can be hidden by default.
*  Should not be able to select the same build more than once.
*  If a failure happens during a check its hard to see where a fix has to be made, include more information to the log entries.
*  It would be good to have a way to linkify the config so it can be linked to from our wiki pages
*  We should use the dashboard names rather than their subdomains
*  Auto generate a full config file based on known-good defaults.


