// Ref: http://www.nodeclass.com/api/mongoose.html
const mongoose = require('mongoose');

const fs = require('fs');
const axios = require('axios');
const {itemBaseUrl, maxItemUrl, concurrentRequestNum} = require('./config');

// Use native promises Ref: http://mongoosejs.com/docs/promises.html
mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost/hn-data');


// Each schema maps to a MongoDB collection and defines the shape of the documents within that collection.
const itemSchema = mongoose.Schema({
    id: Number,         // The item's unique id.
    deleted: Boolean,   // true if the item is deleted.
    type: String,       // The type of item. One of "job", "story", "comment", "poll", or "pollopt".
    by: String,         // The username of the item's author.
    time: Date,         // Creation date of the item, in Unix Time.
    text: String,       // The comment, story or poll text. HTML.
    dead: Boolean,      // true if the item is dead.
    parent: Number,     // The item's parent. For comments, either another comment or the relevant story. For pollopts, the relevant poll.
    kids: [Number],     // The ids of the item's comments, in ranked display order.
    url: String,        // The URL of the story.
    score: Number,      // The story's score, or the votes for a pollopt.
    title: String,      // The title of the story, poll or job.
    parts: [Number],    // A list of related pollopts, in display order.
    descendants: Number,// In the case of stories or polls, the total comment count.
});

// itemSchema.pre('save', function(next) {
//   // transform date
// //   this.time = new Date(this.time);
//   console.log(this.time)
//   next();
// });

// A model is a class with which we construct documents.
const Item = mongoose.model('Item', itemSchema);

// const testPost = new Post({
//     id: 0,
//     text: 'test'
// });

// testPost.save().then(data => {
//     console.log(data)
// });

async function download() {

    // Get current max item on the site and saved max item
    const getMaxItemRes = await axios.get(maxItemUrl);
    const currentMaxItem = Number(getMaxItemRes.data);
    const savedMaxItem = Number(fs.readFileSync('savedMaxItem.json', 'utf-8'));
    console.log('Got savedMaxItem and currentMaxItem: ', savedMaxItem, currentMaxItem);

try {
    // request item and save to database
    for(let i = savedMaxItem; i <= currentMaxItem; i = i + concurrentRequestNum) {

            const requestArr = [];
            try {
                for(let j = i; j <= i + concurrentRequestNum; j++) {
                    requestArr.push((async () => {
                        const getItemRes = await axios.get(`${itemBaseUrl}/${j}.json`);
                        const rawItemData = getItemRes.data;
                        // transform raw item data
                        rawItemData.time = new Date(rawItemData.time * 1000);

                        const item = new Item(rawItemData);
                        const saveItemRes = await item.save();
                        console.log(`Item ${j} saved`);
                    })());
                }
            } catch(err) {
                console.log('catch err when generating promise arr', err)
            }

            try {
                await Promise.all(requestArr);
            } catch(err) {
                console.log('catch err when promise.all', err)
            }

        // update savedMaxItem
        fs.writeFileSync('savedMaxItem.json', i + concurrentRequestNum);
    }
} catch (err) {
    console.log('catch error outside for loop', err)
}

}

download()