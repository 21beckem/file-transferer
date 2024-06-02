document.addEventListener('DOMContentLoaded', () => {
    const peer = new Peer(); // Create a new Peer instance
    let conn; // Variable to hold the connection

    // Display the peer ID
    peer.on('open', (id) => {
        console.log('My peer ID is: ' + id);
        document.body.insertAdjacentHTML('beforeend', `<br>Your peer ID: <input tye="text" value="${id}">`);
    });

    // Handle incoming connections
    peer.on('connection', (connection) => {
        conn = connection;
        console.log('Connected to: ' + conn.peer);
        setupConnection();
    });

    // Connect to a peer
    document.getElementById('connectButton').addEventListener('click', () => {
        const peerId = document.getElementById('peerIdInput').value;
        conn = peer.connect(peerId);

        conn.on('open', () => {
            console.log('Connected to: ' + peerId);
            setupConnection();
        });
    });

    // Handle file input and send files
    document.getElementById('sendFileButton').addEventListener('click', () => {
        const fileInput = document.getElementById('fileInput');
        const files = fileInput.files;
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const reader = new FileReader();

                reader.onload = (event) => {
                    const data = {
                        filename: file.name,
                        filedata: event.target.result
                    };
                    conn.send(data);
                    console.log('File sent:', data);
                };

                reader.readAsArrayBuffer(file);
            }
        } else {
            alert('Please select a file to send.');
        }
    });

    // Setup connection event handlers
    function setupConnection() {
        conn.on('data', handleIncomingData);
        conn.on('close', () => {
            console.log('Connection closed');
        });
    }

    // Handle incoming data
    function handleIncomingData(data) {
        console.log('File received:', data);
        const blob = new Blob([data.filedata]);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = data.filename;
        link.click();
    }
});
