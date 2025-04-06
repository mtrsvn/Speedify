function startSpeedTest() {
  const fileUrl = 'https://archive.org/download/testmp3testfile/mpthreetest.mp3';
  const speedElement = document.getElementById('speed');
  const testButton = document.getElementById('testButton');

  testButton.textContent = 'Stop Test';
  testButton.disabled = true;

  speedElement.textContent = 'Loading';

  const startTime = performance.now();

  fetch(fileUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }
      const contentLength = response.headers.get('content-length');
      if (!contentLength) {
        throw new Error('Missing Content-Length');
      }

      const fileSizeInBytes = parseInt(contentLength, 10);
      let downloadedBytes = 0;

      const reader = response.body.getReader();
      const stream = new ReadableStream({
        start(controller) {
          function push() {
            reader.read().then(({ done, value }) => {
              if (done) {
                controller.close();
                return;
              }
              downloadedBytes += value.length;
              controller.enqueue(value);
              push();
            });
          }
          push();
        },
      });

      return new Response(stream).blob().then(blob => ({
        blob,
        size: fileSizeInBytes,
      }));
    })
    .then(({ size }) => {
      const endTime = performance.now();
      const durationInSeconds = (endTime - startTime) / 1000;

      const downloadSpeedMbps = ((size / durationInSeconds) / (1024 * 1024) * 8).toFixed(2);

      setTimeout(() => {
        speedElement.innerHTML = `<b>${downloadSpeedMbps} Mbps</b>`;
        testButton.textContent = 'Start Test';
        testButton.disabled = false;
      }, 5000);
    })
    .catch(error => {
      speedElement.textContent = `Error: ${error.message}`;
      testButton.textContent = 'Start Test';
      testButton.disabled = false;
    });
}
