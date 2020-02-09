# Task 3 - Testing RESTful API

## Getting Started

First of all you will need to set up the Best Buy API Playground and run it locally.
Set up your environment as explained in the [guide](https://github.com/bestbuy/api-playground/#getting-started).

After that you will need to clone this repo (make sure you have [NodeJS](https://nodejs.org/) installed):

```bash
git clone https://github.com/kabi13/sergi-cabanyes
cd sergi-cabanyes/Task_3
npm install
```

Now to run the tests you just need to use:

```bash
npm test
```

*By default is assuming that you will have your API running on http://localhost:3030, if it's not the case you can change the URL in the ***config.json*** file*

## Explanation

To test this API first I've read the documentation and I've seen it has 6 endpoints and that they accept the methods GET, POST, PUT, PATCH and DELETE. 
So basically I structured myself to cover all the success cases first, then I tried to think on the possible errors and how to validate if they are handled properly, so basically validating what happens when asking for information that doesn't exists, when sending wrong parameters, when exceding the limits or having typos, etc.

*You will see that 21 tests ara failing, this is because it seems that the PATCH method is not working properly, like it's not validating the fields we are sending and it's not giving errors when we are trying to patch protected keys.*

## Technologies

* [Mocha](https://mochajs.org/) 
* [Chai](https://www.chaijs.com/)

