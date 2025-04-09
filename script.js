let APP_ID = '9905308ac16d4d88bc1c4f209dc4d95c'; 

let localStream;
let remoteStream;
let peerConnection;

let uid = String(Math.floor(Math.random * 1000));
let token = null;
let client;

let servers = {
    iceServers:[
        {
            urls:['stun:stun1.1.google.com:19302','stun:stun2.1.google.com:19302']
        }
    ]
}

let init = async () => {
    client = await AgoraRTM.createInstance(APP_ID);
    await client.login({uid,token});       //login client

    const channel = client.createChannel('main');   //once the client is logged in we create a channel
    channel.join();

    channel.on('MemberJoined',handlePeerJoined);

    localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: false});
    try{
        if(localStream){
            document.getElementById('video-1').srcObject = localStream;
        }   
    }catch(err){
        console.log(err);
    }
}

let handlePeerJoined = async (MemberId) => {
    console.log("A new peer has joined this room:",MemberId);
}

let peerConnections = async(sdp) => {
    peerConnection = new RTCPeerConnection(servers);

    remoteStream = new MediaStream();
    document.getElementById('video-2').srcObject = remoteStream;

    //Adds all the tracks from localStream to the peerConnection Object
    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
    })
    
    //Adding tracks to remoteStream
    peerConnection.ontrack = async(event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        }) 
    }

    peerConnection.onicecandidate = async(event) => {
        if(event.candidate){
            document.getElementById(sdp).value = JSON.stringify(peerConnection.localDescription);
        }
    }
}

let createOffer = async() => {
    peerConnections('offer-sdp');
    let offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
}

let createAnswer = async() => {
    peerConnections('answer-sdp');
    let offer = document.getElementById('offer-sdp').value;
    if(!offer) return alert('Retrieve offer from peer first...');

    offer = JSON.parse(offer)
    await peerConnection.setRemoteDescription(offer);

    let answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    document.getElementById('answer-sdp').value = JSON.stringify(answer);
}

let addAnswer = async () => {
    let answer = document.getElementById('answer-sdp').value
    if(!answer) return alert('Retrieve answer from peer first...');

    answer = JSON.parse(answer);
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(answer);
    }

}

init();

document.getElementById('create-offer').addEventListener('click', createOffer);
document.getElementById('create-answer').addEventListener('click', createAnswer);
document.getElementById('add-answer').addEventListener('click', addAnswer);