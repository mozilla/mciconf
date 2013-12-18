##Mozmill CI Configuration Generator

#Overview
Mozmill CI Configuration Generator is an application that intends to generate valid configuration files for Mozmill CI on-demand jobs, in order to reduce the chance of human error.

#Help
* Testruns: Pick a testrun type and a dashboard, from Testrun section. For update testruns you have to either pick a target version or to give a target build ID.
* Builds: Under the "Builds" section you can chose the platforms on winch the jobs will be ran, also the Firefox version and the localization of the Firefox. To add a platform hit the "Add a platform" button under the builds section, to remove a platform hit "Remove platform" button  on the right of the job. You can add multiple Firefox versions for each platform, and you can't add the same platform twice.
* Document: At the end of the page you have the resulted configuration file, please hit the "Check All Builds" button before copying the text, so the application will check the builds and the target build ID for update testruns.
* Logger: all the errors or success messages will be displayed under the "Logger" section, to see older logs hit the "See all history" button at the top of the page.

#Requirements
* We want our application to generate well formed config files
* Should do field validation
* Should check if the given builds exists
* Should be able to load and check external files
* Should be able to save jobs and load them back (localStorage)


