# 🚀 Postman Lite with Copilot Extension

A lightweight Postman alternative integrated directly into VS Code, enhanced with a **Gemini AI Copilot** to assist you with API requests, testing, and troubleshooting.

---

## ✨ Features

- **Full-featured API Client**: Send `GET`, `POST`, `PUT`, `DELETE`, `PATCH` requests.
- **Custom Headers & Body**: Easily configure your request with JSON headers and body.
- **Formatted Responses**: View API responses with syntax highlighting and line numbers.
- **AI-Powered Copilot**:
  - **Generate Requests**: Describe the API request you need (e.g., _"GET user data from GitHub API"_) and the AI will auto-fill the form.
  - **Test Suggestions**: Ask for JavaScript test script suggestions for your API responses.
  - **Troubleshooting & Explanations**: Get instant explanations for HTTP status codes or troubleshooting tips.
- **Clean & Responsive UI**: A modern, intuitive interface designed for productivity.

---

## 🚀 Getting Started

### Installation

1. Open **VS Code**.
2. Go to the Extensions view: `Ctrl+Shift+X` (or `Cmd+Shift+X` on macOS).
3. Search for **"Postman Lite with Copilot Extension"**.
4. Click **Install**.

---

### How to Use

#### Open the Extension:

1. Open the Command Palette: `Ctrl+Shift+P` or `Cmd+Shift+P`.
2. Type `Open Postman Lite` and select:
   > **Postman Lite with Copilot Extension: Open Postman Lite**
3. A new Webview panel will open with the Postman Lite interface.

#### Make an API Request:

- Select the HTTP Method: `GET`, `POST`, `PUT`, etc.
- Enter the URL for your API endpoint.
- Add Headers (as a JSON object) and Body (as a JSON object) if required.
- Click the **Send Request** button.
- The API response will be displayed in the **"API Response"** section below.

#### Use the Copilot AI Assistant:

- Ensure your **Gemini API Key** is configured (see [Configuration](#️-configuration) below).
- Type your query in the **"Copilot AI Assistant"** chat input.

##### Examples:

- _"Create a GET request for https://jsonplaceholder.typicode.com/posts/1"_
- _"How do I send a POST request with a JSON body?"_
- _"Suggest a test to check if the response status is 200."_
- _"What does a 401 Unauthorized error mean?"_

The AI will provide suggestions or auto-fill the API request form.

---

## ⚙️ Configuration

### Gemini API Key Setup

To enable the AI Copilot features, you need a **Google Gemini API Key**:

#### Get your API Key:

- Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create a new API key if you don't have one.

#### Configure in VS Code:

1. Open **VS Code Settings**: `Ctrl+,` or `Cmd+,`.
2. Search for `Postman Lite`.
3. Locate the setting:  
   > `Postman Lite with Copilot Settings: Gemini Api Key`
4. Paste your **Gemini API Key** into this field.
5. **Restart** your VS Code window (or close and reopen the Postman Lite webview) for the changes to take effect.

---

## 🤝 Contributing

Contributions are welcome!  
If you have suggestions, bug reports, or want to contribute code, please open an issue or pull request on the [GitHub repository](https://github.com/KarthicRaja/postman-lite-with-copilot).

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Karthic Raja**

> _Note: Replace `KarthicRaja` in URLs and GitHub repo links once you create and push your project._

