const pdfjsLib = require('pdfjs-dist');

function pdfReader() {

// function l(content) {
//     console.log(content)
// }

//
// If absolute URL from the remote server is provided, configure the CORS
// header on that server.
//
    var url = './assets/ppnt_sign-book.pdf';

//
// In cases when the pdf.worker.js is located at the different folder than the
// PDF.js's one, or the PDF.js is executed via eval(), the workerSrc property
// shall be specified.
//
    pdfjsLib.GlobalWorkerOptions.workerSrc =
        './pdf.worker.bundle.js';

    var pdfDoc = null,
        pageNum = 1,
        pageRendering = false,
        pageNumPending = null,
        scale = 5,
        canvas = document.getElementById('canvas'),
        ctx = canvas.getContext('2d');

    /**
     * Get page info from document, resize canvas accordingly, and render page.
     * @param num Page number.
     */
    function renderPage(num) {
        pageRendering = true;
        // Using promise to fetch the page
        pdfDoc.getPage(num).then(function (page) {
            var viewport = page.getViewport(scale);
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // Render PDF page into canvas context
            var renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            var renderTask = page.render(renderContext);

            // Wait for rendering to finish
            renderTask.promise.then(function () {
                pageRendering = false;
                if (pageNumPending !== null) {
                    // New page rendering is pending
                    renderPage(pageNumPending);
                    pageNumPending = null;
                }
            });
        });

        // Update page counters
        document.getElementById('page_num').textContent = num;
    }

    /**
     * If another page rendering in progress, waits until the rendering is
     * finised. Otherwise, executes rendering immediately.
     */
    function queueRenderPage(num) {
        if (pageRendering) {
            pageNumPending = num;
        } else {
            renderPage(num);
        }
    }

    /**
     * Displays previous page.
     */
    function onPrevPage() {
        if (pageNum <= 1) {
            return;
        }
        pageNum--;
        queueRenderPage(pageNum);
    }

    document.getElementById('prev').addEventListener('click', onPrevPage);

    /**
     * Displays next page.
     */
    function onNextPage() {
        if (pageNum >= pdfDoc.numPages) {
            return;
        }
        pageNum++;
        queueRenderPage(pageNum);
    }

    document.getElementById('next').addEventListener('click', onNextPage);

    /**
     * Asynchronously downloads PDF.
     */
    pdfjsLib.getDocument(url).then(function (pdfDoc_) {
        pdfDoc = pdfDoc_;
        document.getElementById('page_count').textContent = pdfDoc.numPages;

        // Initial/first page rendering
        renderPage(pageNum);
    });

    const attachmentsList = document.getElementById("links");
    const request = new XMLHttpRequest();

    request.open('GET', 'http://site.ppnt.pl/wp-json/wp/v2/identyfikacja', true);

    request.onload = function () {
        const data = JSON.parse(this.response);

        function showAttachments() {
            attachmentsList.innerHTML = "";
            data.forEach(page => {
                if (page["slug"] === `strona-${pageNum}`) {
                    const pageAttachments = page.acf.attachments;
                    if (pageAttachments) {
                        pageAttachments.forEach(attachment => {
                            const attachmentURL = `http://site.ppnt.pl${attachment.attachment.url}`;
                            const attachmentTitle = attachment.attachment.title;
                            const link = document.createElement('a');
                            link.href = attachmentURL;
                            link.setAttribute("download", true);
                            link.setAttribute("target", "_blank");
                            link.textContent = attachmentTitle;

                            attachmentsList.appendChild(link);
                        })
                    } else {
                        attachmentsList.innerHTML = "brak załączników";
                    }
                }
            });
        }


        document.querySelector('#next').addEventListener('click', showAttachments);
        document.querySelector('#prev').addEventListener('click', showAttachments);
    };

    request.send();
}

export default pdfReader;