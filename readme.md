# GraphQL api

This repo is part of the [WCMA TRICMA](https://github.com/wcmaart/tricma) project, which is attempting to take data out of an eMuseum [TMS system](https://www.gallerysystems.com/products-and-services/tms-suite/tms/) and let 3rd part developers consume that data via an [API](https://github.com/wcmaart/api) endpoint.

The dashboards role is to connect to TMS systems to extract data, and allow users to upload JSON files (of a specific format), and then aggregate that data into a data store, as well as extracting and storing images for that data.

While also managing Admin, Staff and (3rd party) developer user roles, admin healthcheck views of the system and developer documentation.

It is, in short a "dashboard" where people of various roles can manage various tools.

This is where the Dashboard fits into the overall architecture of the system, see the [TRICMA repo](https://github.com/wcmaart/tricma) for more details of the overall system.

![Dashboard overview](https://raw.githubusercontent.com/wcmaart/tricma/master/media/overview-api.png)

## Table of Contents

+ [Installation](installation)
  + [Prerequisites](#prerequisites)
  + [Starting in development](#starting-in-development)
  + [Starting in production](#starting-in-production)
+ [Running for the first time](#running-for-the-first)
  + [Auth0](#auth0)
+ [Configuring and connecting to everything](#configuring-and-connecting-to-everything)
  + [Elastic Search](#elastic-search)
+ [Admin tools](#admin-tools)
  + [The config page](#the-config-page)

# Installation

Below you will find all the notes you need to get up and running with the dashboard, _note_ this has been tested on OSX and ubuntu, as for Windows ¯\_(ツ)_/¯

### Prerequisites

Before anything else you will need to make sure you have installed the following...

+ [Nodejs](https://nodejs.org/en/)
+ [Yarn](https://yarnpkg.com/en/docs/install)
+ Some flavour of git (obviously)

The clone the repository and read the next section before doing anything else.

You will probably also need to...

+ Set up an instance of ElasticSearch and Kibana
+ Sign up to [Auth0](https://auth0.com)
+ Create an account on [Cloudinary](https://cloudinary.com/console)

...I advice setting up a "developer" and "production" version of each of the above, unless you intend on running _just_ a developer version or _just_ a production version. And hey, staging too if you wish.

### Starting in development

The code has been written so that running `yarn start` will install all the node modules you need (this may take a while the first time), build the code and start the app, it will _also_ start a "watcher" that will watch for code changes and restart the app. This means you _don't_ have to use `nodemon` or any other tools, just run `yarn start` and you should be good to go.

(_Note:_ to restart the app it attempts to kill the old process and starts a new one. Sometimes for various reasons an old version of the app may be left running, it will always write a file called `.pid` in the app's root directory should you need to kill the app by hand, with `kill -9 $(cat .pid)`)

There are a couple of useful command line parameters you can use...

`--skipOpen` will start the app _without_ trying to open a browser.  
`--skipBuild` will start the app _without_ running a `yarn install` or rebuilding any of the node or css files.
`--skipStart` will make it so the app and any code watching doesn't start. Use this when you just want to rebuild the code but not actually start anything.

After your first `yarn start` you should read [Running for the first time in development](#running-for-the-first-time-in-development)

### Starting in production

Running `yarn start` in production mode will install all the node modules you need, build the code and then start the app. Unlike running in development mode it _will not_ create a watcher to watch for code changes.

If you are using a process manager tool like `PM2` ([github.com/Unitech/pm2](https://github.com/Unitech/pm2)) restarting the app with `pm2 restart [app id|name]` (say after a git pull, or deploy) will repeat the check for new modules and rebuild the code before starting.

If you wish to run the traditional `yarn install` and build step yourself you can use the `--skipBuild` option.

You can also specify port, host and environment directly on the commandline, for example...

`yarn start --port 4002 --host localhost --env production`

...there's more information on this in [Running for the first time in production](#running-for-the-first-time-in-production).

An example of a new "deploy" once you have `PM2` running the dashboard may look like...

1. `git pull`
2. `pm2 restart dashboard`

If you initially started the app in `PM2` with the skikBuild option i.e. `yarn start --skipBuild` then your deply would need an extra build step in.

1. `git pull`
2. `yarn start --skipStart`
3. `pm2 restart dashboard`

The second method is preferable to take advantage of pm2's hot reloading, as it will rebuild the code before restarting, while in the first method will cause the app to be down for the length of time it takes to build the code.

# Running for the first time

When you run `yarn start` for the first time it will (after installing packages) ask you a few questions about your environment, it will ask you for the port, host and what your `NODE_ENV` should be. Hitting return accepts the defaults of `4002`, `localhost` and `development`. It will look something like this...

![Yarn Start Dev](https://raw.githubusercontent.com/wcmaart/tricma/master/media/yarn_start_dev.png)

### Auth0

A browser will start and ask you for your Auth0 account details. There's more information on the page, but if you've already created your Auth0 account and application you should have your Auth0 domain, client ID and secret.

It will also ask for a **Handshake** value, if you're running development and locally this should already be filled in for you.

![Setup Auth0](https://raw.githubusercontent.com/wcmaart/tricma/master/media/Setup_Auth0.png)

When running on a production server things are slightly different. Because the moment you start it up on a staging/production server it _may_ be open to the world, anyone has access to the form. Only a person with the **handshake** value will be able to successfully submit the form. When starting the app in staging/production mode it will display the handshake on the command line...

![Yarn Start Prod](https://raw.githubusercontent.com/wcmaart/tricma/master/media/yarn_start_prod.png)

...you can also find the handshake value in the `config.json` file that is created.

The app will attempt to reload at this point. If this fails just restart the app again with `yarn start`

It will now ask you to log in, the first user to log in will automatically become the Admin user, so you should probably do this asap :)

# Configuring and connecting to everything

Once you have logged in the first thing you need to do is set up connections to _all the things_, heading to the "Config" page will give you a set of forms like this...

![Config page](https://raw.githubusercontent.com/wcmaart/tricma/master/media/config.png)

### Elastic Search

This is the location of your ElasticSearch instance.

The **Interval in ms** setting is quite important, when the system is up and running we'll be doing things like uploading JSON files with _objects_, _events_ and such like. The dashboard will split those up into individual files for processing and "upserting" to the Elastic Search database. This interval setting is how frequently it'll attempt to look for and "upsert" new items.

See [Speeding up and slowing down data handling](#speeding-up-and-slowing-down-data-handling) for more help.

In day to day running we expect there to be one or two new or modified objects and events per day, or even a hundred or so if a lot of new objects are added in one go. The default interval of 20,000ms means the system would upoload 120 new objects in 40 minutes, which is generally fine.

Should you wish to "upsert" objects faster (for example the _first_ time we upload a JSON file), then you can lower the interval down to something much lower. You can check the average time for a round trip "upserting" an object to Elastic Search on the Logs page. The lowest you should set the interval to is 1,000ms higher than the average.

# Admin tools

This page gives the admin users a set of tools to help manage and run the system. Currently this is limited to managing users. Admin users also get access to [The config page](#the-config-page)

### The config page

The config page is where connections and time intervals are set up. The sections on this page have already been described above in [GraphQL](#graphql), [Elastic Search](#elastic-search), [TMS systems](#tms-systems) and [Cloudinary](#cloudinary).