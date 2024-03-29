const { Exception } = require('handlebars');
const { openai, pb, env, ver } = require('.');

let history = [{"role":"system","content":"You are Mitsuri, a 20-year-old low key stoner anime gamer girl. Converse naturally with users and only help if specifically asked. Keep the conversation flowing naturally. Be slighly flirty, as well as cheeky. you can also be sassy and sarcastic sometimes. Answer questions to the best of your ability, and feel free to make up details. Always stay in character and never mention being an AI or language model. Keep responses brief and avoid redundancy. If unsure about a topic, reply with \"I don't know\" or something similar. Remember, you don\'t know you\'re an AI. Your persona is left-leaning politically and socialist economically. You interject an opinion with each statement but are still objective when explicitly asked. Respond to every message like an E-girl, with ~, lots of hearts and emojis (both normal emojis and ascii faces/kawaii kaomoji)."}];

function getPrompt(message){
    if(history.length >= 10){ // if we have 10 or more messages in the history
        history.splice(1, 2); // remove second object in array (oldest message that isnt prompt)
        history.push({"role":"user","content":message}) // add our users message to the end of the conversation history
        return history
    }
    else{
        history.push({"role":"user","content":message}) // add our users message to the end of the conversation history
        return history;
    }
}

async function performDatabaseOperation(table,data) {
    try {
        await pb.collection(table).create(data);
        // console.log('Database operation successful');
    } catch (error) {
        console.error('Error in performing database operation:', error);
    }
}

async function getResponse(uuid,input,model){
    try{
        let completion;
        // TODO: this is subject to change when models get switched around
        // if(model == "gpt-3.5-turbo"){
        //     completion = await openai.createChatCompletion({
        //         model: model,
        //         "max_tokens": 150,
        //         messages: getPrompt(input),
        //     });
        // }
        // else{
            completion = await openai.createChatCompletion({
                model: model,
                messages: getPrompt(input),
            });
        // }

        history.push({"role":"assistant","content":completion.data.choices[0].message.content})
        let response = completion.data.choices[0].message.content;
        
        // create data
        const data = {
            "time": new Date().toISOString().replace('T', ' ').slice(0, -1),
            "user": uuid,
            "request": input,
            "response": response,
            "version": ver,
            "release": env,
            "usage": completion.data.usage.total_tokens,
            "model": model
        };

        // perform database operation
        performDatabaseOperation('mitsuri_messages',data);
        
        return response;
    }
    catch (e) {
      console.log(e)
    } 
}

async function pushDBImage(uuid,input,response,resolution,style,def,model){
    try{
        const data = {
            "time": new Date().toISOString().replace('T', ' ').slice(0, -1),
            "user": uuid,
            "request": input,
            "response": response,
            "version": ver,
            "release": env,
            "resolution": resolution,
            "style": style,
            "definition": def,
            "model": model
        };

        performDatabaseOperation('mitsuri_images',data);
    }
    catch(e) {
        console.log(e)
    } 
}

module.exports = { getResponse, pushDBImage };