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
let totalFilesToDownload = 0;
let filesDownloadedSoFar = 0;
let progressBar = new CircularProgressBar({
    percent: 100,
    color: 'var(--dark)',
    fractionTotal: totalFilesToDownload,
    pie: 'progressBar',
    color: '#E91E63'
});
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
function sendSelectedFiles() {
    const fileInput = _('fileInput');
    const files = fileInput.files;

    conn.send({
        type: 'send start',
        amount: files.length
    });
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();

            reader.onload = (event) => {
                const data = {
                    type: 'file',
                    filename: file.name,
                    filedata: event.target.result
                };
                conn.send(data);
                console.log('File sent:', data);
            };

            reader.readAsArrayBuffer(file);
        }
        JSAlert.alert('File(s) sent successfully!', '', JSAlert.Icons.Success);
        _('confirmSendBtn').style.display = 'none';
    } else {
        JSAlert.alert('Please select a file to send.', '', JSAlert.Icons.Warning);
    }
}
_('fileInput').addEventListener('change', () => {
    const fileInput = _('fileInput');
    const files = fileInput.files;
    console.log(fileInput.files);
    _('selectFilesButton').innerHTML = `Change Selection`;
    _('selectFilesText').innerHTML = files.length + ' file(s) Selected';
    _('confirmSendBtn').style.display = (files.length > 0) ? 'block' : 'none';
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
    if (data.type == 'file') {
        filesDownloadedSoFar++;
        progressBar.updateProgress(Math.round((filesDownloadedSoFar / totalFilesToDownload) * 100), totalFilesToDownload);
        if (filesDownloadedSoFar == totalFilesToDownload) {
            totalFilesToDownload = 0;
            filesDownloadedSoFar = 0;
            JSAlert.alert('All file(s) received successfully!', '', JSAlert.Icons.Success);
        }
        _('progressBarBox').style.display = '';
        const blob = new Blob([data.filedata]);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = data.filename;
        link.click();
    } else if (data.type == 'send start') {
        _('progressBarBox').style.display = '';
        totalFilesToDownload += data.amount;
        progressBar.updateProgress(Math.round((filesDownloadedSoFar / totalFilesToDownload) * 100), totalFilesToDownload);
        JSAlert.alert('getting ' + data.amount + ' file(s)');
    }
}