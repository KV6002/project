const client = require("./db");

(async () => {
    const covidDb = client.db("covid");
    const cases = covidDb.collection("vaccines");  
  
    // Print a message if no documents were found
    if ((await cases.countDocuments({})) === 0) {
      console.log("No documents found!");
    }
  
    const cursor = cases.find({})
  
    // Print returned documents
    for await (const doc of cursor) {
      console.dir(doc);
    }
  })();