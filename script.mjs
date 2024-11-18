import * as pdfjsLib from "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.min.mjs";
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.8.69/pdf.worker.min.mjs";

const fileInput = document.querySelector("#file-js-example input[type=file]");
const clearBtn = document.getElementById('clear');
const downloadBtn = document.getElementById('download');
const fileNameLabel = document.querySelector('.file-name');

document.getElementById('fileInput').addEventListener('change', async function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileReader = new FileReader();
  fileReader.onload = async function() {
    const pdfData = new Uint8Array(this.result);

    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    // Use PDFLib to create a new document
    const pdfDoc = await PDFLib.PDFDocument.create();

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Extract text
      const text = textContent.items.map(item => item.str).join('');
      let segments = text.split(/(?=FF)/);
      
      const strips = [];
      segments.forEach(element => {
        if (!element.startsWith('FF')) {
          return;
        }
        const match = element.match(/\((.*?)\)/);
        const topLeft = match[1].split('-')[2][0]
        const planeModel = match[1].split('-')[3].split('/')[0]
        const topRight = match[1].split('/')[1][0]
        const callSign = match[1].split('-')[1]

        strips.push({
          topLeft,
          planeModel,
          topRight,
          callSign
        })
      });

      const { PDFDocument, rgb } = PDFLib;
      const pageWidth = 600;
      const pageHeight = 400;

      // Table layout
      const startX = 10; // Starting X position
      const startY = pageHeight - 10; // Starting Y position
      const rowHeight = 50; // Height of each row
      const columnWidths = [75, 75, 75, 75, 37.5, 37.5, 37.5, 75]; // Widths of each column
      const marginBottom = 10; // Margin at the bottom of the page

      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let y = startY;

      const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const drawRow = async (row) => {
        // Top left
        const topLeftText = row.topLeft.toUpperCase();
        const topLeftWidth = font.widthOfTextAtSize(topLeftText, 10); // Calculate width of text
        const topLeftCenteredX = 20 - topLeftWidth / 2; // Adjust x to center the text
        currentPage.drawText(topLeftText, {
          x: topLeftCenteredX,
          y: y - 15,
          size: 10,
          color: rgb(0, 0, 0),
        });
        // Plane Model
        const planeModelText = row.planeModel.toUpperCase();
        const planeModelWidth = font.widthOfTextAtSize(planeModelText, 10); // Calculate width of text
        const planeModelCenteredX = 47.5 - planeModelWidth / 2; // Adjust x to center the text
        currentPage.drawText(planeModelText, {
          x: planeModelCenteredX,
          y: y - 15,
          size: 10,
          color: rgb(0, 0, 0),
          font: font,
        });
        // Top Right
        const topRightText = row.topRight.toUpperCase();
        const topRightWidth = font.widthOfTextAtSize(topRightText, 10); // Calculate width of text
        const topRightCenteredX = 75 - topRightWidth / 2; // Adjust x to center the text
        currentPage.drawText(topRightText, {
          x: topRightCenteredX,
          y: y - 15,
          size: 10,
          color: rgb(0, 0, 0),
        });
        // Call Sign
        const callSignText = row.callSign.toUpperCase();
        const callSignWidth = font.widthOfTextAtSize(callSignText, 12); // Calculate width of text
        const callSignCenteredX = 47.5 - callSignWidth / 2; // Adjust x to center the text
        currentPage.drawText(callSignText, {
          x: callSignCenteredX,
          y: y - 40,
          size: 12,
          color: rgb(0, 0, 0),
        });
        // Depart From
        if ('departFrom' in row) {
          const departFromText = row.departFrom.toUpperCase();
          const departFromWidth = font.widthOfTextAtSize(departFromText, 12); // Calculate width of text
          const departFromCenteredX = 332 - departFromWidth / 2; // Adjust x to center the text
          currentPage.drawText(departFromText, {
            x: departFromCenteredX,
            y: y - 15,
            size: 10,
            color: rgb(0, 0, 0),
          });
        }
        // Arrive At
        if ('arriveAt' in row) {
          const arriveAtText = row.arriveAt.toUpperCase();
          const arriveAtWidth = font.widthOfTextAtSize(arriveAtText, 12); // Calculate width of text
          const arriveAtCenteredX = 406 - arriveAtWidth / 2; // Adjust x to center the text
          currentPage.drawText(arriveAtText, {
            x: arriveAtCenteredX,
            y: y - 15 - rowHeight / 2,
            size: 10,
            color: rgb(0, 0, 0),
          });
        }

        // Borders
        for (let i = 0; i < 8; i++) {
          const x = startX + columnWidths.slice(0, i).reduce((a, b) => a + b, 0);
          const cellHeight = rowHeight / 2;

          // Draw the horizontal divider
          if (i >= 4 && i <= 6) {
            currentPage.drawLine({
              start: { x, y: y - cellHeight },
              end: { x: x + columnWidths[i], y: y - cellHeight },
              thickness: 1,
              color: rgb(0, 0, 0),
            });
          };
          // Draw the border for all cells
          currentPage.drawRectangle({
            x,
            y: y - rowHeight,
            width: columnWidths[i],
            height: rowHeight,
            borderWidth: 1,
            borderColor: rgb(0, 0, 0),
          });
        };
      };

      // Draw rows with pagination
      strips.forEach((row) => {
        if (y - rowHeight - marginBottom < 0) {
          // Add a new page if the current one is full
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          y = startY;
        }
        drawRow(row);
        y -= rowHeight + 10; // Move to the next row position
      });
    }

    // Save the modified PDF
    const pdfBytes = await pdfDoc.save();

    // Download the modified PDF
    document.getElementById('download').onclick = () => {
      // Get the original file name from the file input
      const originalFileName = fileInput.files[0].name;
      
      // Generate the new file name by appending " flight strips" to the original file name
      const newFileName = originalFileName.replace(/\.[^/.]+$/, '') + ' - Flight Strips.pdf';
      
      // Create a Blob from the modified PDF data
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      
      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = newFileName; // Use the new file name for download
      a.click();
      
      // Clean up the URL object
      URL.revokeObjectURL(url);
    };
  };

  fileReader.readAsArrayBuffer(file);
});

fileInput.onchange = () => {
  if (fileInput.files.length > 0) {
    const fileName = document.querySelector("#file-js-example .file-name");
    fileName.textContent = fileInput.files[0].name;

    const downloadButton = document.getElementById('download');
    downloadButton.disabled = false;
  }
};

// Function to reset file input and disable the "Clear" button
function resetFileInput() {
  fileInput.value = ''; // Reset the file input value
  fileNameLabel.textContent = 'No file uploaded'; // Update the label
  downloadBtn.disabled = true; // Disable the download button
  clearBtn.disabled = true; // Disable the clear button
}

// Event listener for file input change (when a file is selected)
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    fileNameLabel.textContent = fileInput.files[0].name; // Show the file name
    downloadBtn.disabled = false; // Enable the download button
    clearBtn.disabled = false; // Enable the clear button
  }
});

// Event listener for the "Clear" button click
clearBtn.addEventListener('click', resetFileInput);

// Disable the "Clear" button initially
clearBtn.disabled = true;
downloadBtn.disabled = true;