const speechRecognition =window.speechRecognition
console.log(speechRecognition)
if(!speechRecognition){
    console.error("not supported")
}else{
const r =new speechRecognition()
r.continous =false
r.interimResults =false
r.maxAlternatives =1


r.onstart() =function(){console.log("R started")}
r.onresult =function(event){
    const transcript =event.results[0][0].transcript;
    console.log(`you said:${transcript}`)
}

r.start()
console.log("started")
}
