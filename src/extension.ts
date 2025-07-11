import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, "postman-lite-copilot-extension" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    "postman-lite-copilot-extension.openPostmanLite",
    () => {
      const panel = vscode.window.createWebviewPanel(
        "postmanLite",
        "Postman Lite with Copilot",
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, "src", "webview")),
          ],
        }
      );

      const webviewPath = path.join(
        context.extensionPath,
        "src",
        "webview",
        "index.html"
      );
      let htmlContent = "";
      try {
        htmlContent = fs.readFileSync(webviewPath, "utf8");
      } catch (error) {
        // vscode.window.showErrorMessage(`Failed to load webview HTML: ${error.message}`);
        console.error(`Error reading ${webviewPath}:`, error);
        return;
      }

      panel.webview.html = htmlContent;

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        (message) => {
          switch (message.command) {
            case "alert":
              vscode.window.showInformationMessage(message.text);
              return;
            case "getGeminiApiKey":
              // Read the API key from VS Code settings
              const config = vscode.workspace.getConfiguration("postmanLite");
              const geminiApiKey = config.get<string>("geminiApiKey");

              // Send the API key back to the webview
              panel.webview.postMessage({
                command: "sendGeminiApiKey",
                apiKey: geminiApiKey || "", // Send empty string if not set
              });
              return;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {
  console.log('"postman-lite-copilot-extension" is now deactivated.');
}
