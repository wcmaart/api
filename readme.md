# Williams College Museum of Art (WCMA) API

The collection data is from [*Collection*](https://github.com/wcmaart/collection) and is CC0 licensed, see that repository for more details

# Getting started

First, clone this repo and its submodules

    git clone --recursive https://github.com/wcmaart/api

You will need to export the emuseum api key to `EMUSEUM_KEY` if you want `objects` to retreive from there.

```bash
npm install
export EMUSEUM_KEY="youremuseumapikeyhere"
npm start
```

You will probably want to visit [http://localhost:4000/playground][] and [http://localhost:4000/voyager][]

# Technologies

Right now this is a graphql endpoint, that can

* query objects

```graphql
{
  objects(ids:[123]) {
    title

  raw {
      ...on EmuseumObject {
        primaryMedia {
          value
        }
      }
      ...on CsvObject {
        filename
      }
    }

	}
}
```

* query a test endpoint

```graphql
{
    hello {
      there
    }
}
```

* update the test endpoint

```graphql
mutation {
    setHello(there: "Monsieur Kenobi") {
      there
    }
}
```

Note that mutations will return the previous data if successful

# Philosophy

* Examples are more humane than documentation
* The less technologies the better
