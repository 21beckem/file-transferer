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
// request screen lock
function requestScreenLock() {
    let noMessage = "Please don't let your screen turn off";
    if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen')
           .then(lock => {
            if (!lock) {
                JSAlert.alert(noMessage, '', JSAlert.Icons.Warning);
            } else {
                JSAlert.alert("Please don't close this app");
            }
        });
    } else {
        JSAlert.alert(noMessage, '', JSAlert.Icons.Warning);
    }
}
function StartConnectToPeer() {
    OpenPageSection('ConnectToPeer');
    qrScanner.start();
}
let totalFilesToDownload = 0;
let filesDownloadedSoFar = 0;
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
const chunks = {}; // Store file chunks by filename

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
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const chunkSize = 1000 * 1024; // 1MB
            const progressBar = createProgressBar(file.name, 'upload');
            document.body.appendChild(progressBar.container);

            let offset = 0;

            function readChunk() {
                const reader = new FileReader();
                const slice = file.slice(offset, offset + chunkSize);

                reader.onload = (event) => {
                    conn.send({
                        filename: file.name,
                        filedata: event.target.result,
                        totalSize: file.size
                    });

                    offset += chunkSize;
                    const percentComplete = (offset / file.size) * 100;
                    progressBar.progress.value = percentComplete;
                    console.log('upload Progress: ', percentComplete, 'name:' , file.name);

                    if (offset < file.size) {
                        readChunk();
                    } else {
                        console.log('File sent:', file.name);
                        progressBar.container.remove(); // Remove the progress bar when done
                    }
                };

                reader.readAsArrayBuffer(slice);
            }

            readChunk();
        }
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
    if (!chunks[data.filename]) {
        chunks[data.filename] = [];
        chunks[data.filename].size = 0;
        const progressBar = createProgressBar(data.filename, 'download');
        chunks[data.filename].progressBar = progressBar;
        document.body.appendChild(progressBar.container);
    }

    chunks[data.filename].push(data.filedata);
    chunks[data.filename].size += data.filedata.byteLength;

    const progressBar = chunks[data.filename].progressBar;
    const totalSize = data.totalSize;
    const percentComplete = (chunks[data.filename].size / totalSize) * 100;
    progressBar.progress.value = percentComplete;
    console.log('download Progress: ', percentComplete, 'name: ', data.filename);

    if (chunks[data.filename].size === totalSize) {
        const blob = new Blob(chunks[data.filename]);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = data.filename;
        link.click();
        progressBar.container.remove(); // Remove the progress bar when done
        delete chunks[data.filename];
    }
}
// Create a progress bar for upload or download
function createProgressBar(filename, type) {
    const container = document.createElement('div');
    const label = document.createElement('span');
    const progress = document.createElement('progress');

    container.className = `${type}-progress-container`;
    label.textContent = `${type === 'upload' ? 'Uploading' : 'Downloading'}: ${filename}`;
    progress.max = 100;
    progress.value = 0;

    container.appendChild(label);
    container.appendChild(progress);

    return { container, progress };
}