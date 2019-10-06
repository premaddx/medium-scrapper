# medium-scrapper
> Crawler to recursively crawl through medium.com while maintaining a concurrency of 5 requests.


# Steps for Project setup -

1. Clone the project.
2. Run command - $ npm install
3. Create a folder - env in the root directory of project
4. Create files - default.json and development.json inside newly created folder env for declaring the logger level.
    File content for both files e.g. -
```javascript
    {
        "LOGGER_LEVEL": "debug"
    }
```
5. Create a file .env in the root directory of project which contains the environment configurations. e.g.
```shell
    NODE_ENV=development
    PORT=5000

    DB=medium-scrapper
    DB_URI=medium_crawler:Medium123@ds129098.mlab.com:29098
```

6. To run the project run command -
```shell
    $ node index.js
```


# Dockerization -

## 1. Build the docker image
```shell
    $ docker build -t medium-scrapper .
```

## 2. Run the docker image
```shell
    $ docker run -p 5000:5000 medium-scrapper
```


# API

## GET - http://localhost:5000/api/v1/record

### Fetch Url Count and Parametes

### Sample response -
```json
{
    "success": true,
    "data": [
        {
            "params": [
                "operation",
                "redirect",
                "source"
            ],
            "url": "https://medium.com/m/signin",
            "count": 173
        },
        {
            "params": [
                "source"
            ],
            "url": "https://medium.com/membership",
            "count": 40
        },
    ],
}
```
