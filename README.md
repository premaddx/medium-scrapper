# medium-scrapper
Crawler to recursively crawl through medium.com while maintaining a concurrency of 5 requests.


# Steps for Project setup -

1. Clone the project.
2. Run command - $ npm install
3. Create a folder - env
4. Create files - default.json and development.json for declaring the logger level. File content e.g. -
    {
        "LOGGER_LEVEL": "debug"
    }
5. Create a file .env which contains the environment configurations. e.g.

    NODE_ENV=development
    PORT=5000

    DB=medium-scrapper
    DB_URI=medium_crawler:Medium123@ds129098.mlab.com:29098

6. To run the project run command - $ node index.js


# Dockerization -

1. Build the docker image
$ docker build -t medium-scrapper .

2. Run the docker image
$ docker run -p 5000:5000 medium-scrapper


# API

# GET - http://localhost:5000/api/v1/record

# Fetch Url Count and Parametes

# Sample response -
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
