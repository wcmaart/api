# Williams College Museum of Art (WCMA) API

The collection data is from [*Collection*](https://github.com/wcmaart/collection) and is CC0 licensed, see that repository for more details

# Getting started

First, clone this repo and its submodules

    git clone --recursive https://github.com/wcmaart/api

To access the getObject endpoint, you will need to export the api key to `EMUSEUM_KEY`

```bash
    npm install
    npm start
    open http://localhost:4000/graphql
```

# Technologies

Right now this is a graphql endpoint, that can

* query the emuseum api objects

```graphql
    {
        getObject(id:16677) {
            title {
                value
            }
            primaryMedia {
                value
            }
        }
    }
```

* query artworks from the csv

```graphql
    {
      Artworks(ids:[4163]) {
        title
      }
    }

* mutate the csv

```graphql
    mutation {
      upsertArtworks(artworks:[{
        id:123,
        title:"Artists must suffer, that's why its called PAINting"
      }]) {
        id,
        title
      }
    }
```

* mutate the in-memory database

```graphql
    mutation {
        upsertHello(hello:"friend")
    }
```

* query the in-memory database

```graphql
    {
        hello
    }
```

# Philosophy

Examples are more humane than documentation
The less technologies the better
