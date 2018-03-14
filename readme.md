[![DOI](https://zenodo.org/badge/82729276.svg)](https://zenodo.org/badge/latestdoi/82729276)

# Williams College Museum of Art (WCMA) API

The collection data is from [*Collection*](https://github.com/wcmaart/collection) and is CC0 licensed, see that repository for more details

To access the getObject endpoint, you will need to export the api key to `EMUSEUM_API`


    npm install
    npm start
    open http://localhost:4000/graphql

# Technologies

Right now this is a graphql endpoint, that can

* query the emuseum objects directly

    curl /

* query artworks indirectly

    curl /

* mutate artworks directly

    curl

# Philosophy

Examples are more humane than documentation
The less technologies the better
