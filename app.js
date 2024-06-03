function _(x) { return document.getElementById(x); }
_('connectToPeerBtn').disabled = true;
const qrScanner = new QrScanner(
    _('qrScannerPreview'),
    result => {
        _('peerIdInput').value = result.data;
        qrScanner.stop();
        attemptConnectToPeer();
    },
    {}
);
function StartConnectToPeer() {
    OpenPageSection('ConnectToPeer');
    qrScanner.start();
}

function OpenPageSection(newSectionId) {
    _('MyPeerId').style.display = 'none';
    _('ConnectToPeer').style.display = 'none';
    _('FileSending').style.display = 'none';
    if (newSectionId != 'ConnectToPeer') {
        qrScanner.stop();
    }
    _(newSectionId).style.display = 'block';
}


const peer = new Peer(); // Create a new Peer instance
let conn; // Variable to hold the connection

// Display the peer ID
peer.on('open', (id) => {
    _('yourPeerCode').innerHTML = id;
    // create the QR code
    new QRCode(_("qrcode"), id);
    OpenPageSection('MyPeerId');
    _('connectToPeerBtn').disabled = false;
});

// Handle incoming connections
peer.on('connection', (connection) => {
    conn = connection;
    console.log('Connected to: ' + conn.peer);
    setupConnection();
});

// Connect to a peer
function attemptConnectToPeer() {
    const peerId = _('peerIdInput').value;
    conn = peer.connect(peerId);

    conn.on('open', () => {
        console.log('Connected to: ' + peerId);
        setupConnection();
    });
};

// Handle file input and send files
_('sendFileButton').addEventListener('click', () => {
    const fileInput = _('fileInput');
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
    OpenPageSection('FileSending');
    conn.on('data', handleIncomingData);
    conn.on('close', () => {
        console.log('Connection closed');
        location.reload();
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