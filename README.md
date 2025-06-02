# PDF to High-Quality JPG Converter 🖼️📄

A web-based tool that allows users to convert PDF pages into high-quality JPG images. Supports drag & drop upload, URL-based loading, selective page conversion, and downloading all images as a ZIP archive.

---

## 🌟 Features

- 📥 **Drag & Drop** or **browse** PDF files from your device
- 🔗 Load PDF directly from a URL
- 🎯 Convert specific pages by specifying ranges (e.g., `1-3,5,7-9`)
- ⚡ High-quality JPG image generation using PDF.js rendering
- 📦 Download all converted images bundled in a ZIP file (powered by JSZip)
- 📊 Visual conversion progress with progress bar and status updates
- 🖼️ Preview converted images with pagination controls
- 💻 Responsive and modern UI with icons from Font Awesome and Poppins font
- 🕶️ Stylish dark/light UI ready (depending on your CSS)
- Footer with version info and credits

---

## 🚀 How to Use

1. **Open the app** in a modern web browser (Chrome, Firefox, Edge).

2. **Upload your PDF**:
   - Drag & drop your PDF file into the drop area, or
   - Click the drop area to browse and select a file, or
   - Switch to the **URL** tab and enter a direct PDF link, then click "Load PDF".

3. (Optional) Use the **Advanced Options** to specify which pages to convert (e.g., `1-5,7,10`).

4. Click the **Convert** button to start converting pages to JPG images.

5. Watch the **progress bar** to monitor conversion progress.

6. After conversion, preview images using the pagination controls.

7. Click **Download All as ZIP** to download all images in one archive.

---

## 🔗 Deploy Link

Try the live version here:  
👉 [https://mish0as.github.io/PDF-To-JPG/](https://mish0as.github.io/PDF-To-JPG/)  

---

## 🛠️ Technologies Used

- [PDF.js](https://mozilla.github.io/pdf.js/) — Rendering PDF pages to canvas  
- [JSZip](https://stuk.github.io/jszip/) — Creating ZIP archives in-browser  
- [Font Awesome](https://fontawesome.com/) — Icons  
- [Poppins](https://fonts.google.com/specimen/Poppins) — Web font  
- Vanilla JavaScript, HTML5, and CSS3 for UI and interactivity  

---

## 📦 Files

- `index.html` — Main HTML file  
- `style.css` — CSS styles (external stylesheet)  
- `script.js` — JavaScript logic handling PDF loading, conversion, UI, and ZIP creation  

---

## ⚠️ Notes & Tips

- Ensure the PDF URL is a direct link ending with `.pdf` and allows CORS requests.  
- Large PDFs or high page counts may take longer to process, depending on your device.  
- Conversion quality depends on PDF.js rendering and browser capabilities.  
- Use modern browsers for best performance and compatibility.

---

## 🧑‍💻 Development

To customize or extend this app, you can modify:

- `script.js` for conversion logic, UI updates, and event handling  
- `style.css` for styling and responsiveness  
- `index.html` for structure and layout

---

## 📄 License

This project is open-source and free to use.

---

Made with ❤️ by MAS — enjoy converting PDFs effortlessly! 🚀
