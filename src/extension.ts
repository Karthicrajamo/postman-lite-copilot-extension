import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import fetch, { RequestInit, HeadersInit } from "node-fetch"; // Import fetch and its types

/**
 * Interfaces for messages sent from webview to extension host
 */
interface SendHttpRequestMessage {
  command: "sendHttpRequest";
  data: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any; // Body can be any type, often a JSON object
  };
}

interface GetGeminiApiKeyMessage {
  command: "getGeminiApiKey";
}

interface GetGeminiSuggestionMessage {
  command: "getGeminiSuggestion";
  data: {
    prompt: string;
  };
}

// New interface for the 'alert' message
interface AlertMessage {
  command: "alert";
  text: string;
}

/**
 * Union type for all messages the webview can send to the extension host
 */
type WebviewMessage =
  | SendHttpRequestMessage
  | GetGeminiApiKeyMessage
  | GetGeminiSuggestionMessage
  | AlertMessage; // Added AlertMessage

/**
 * Interfaces for messages sent from extension host to webview
 */
interface HttpResponseData {
  status: number;
  statusText: string;
  timeTaken: string;
  responseData: string;
  error?: { message: string };
}

interface GeminiResponseData {
  aiText?: string;
  error?: { message: string };
}

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, "postman-lite-copilot-extension" is now active!'
  );

  let disposable = vscode.commands.registerCommand(
    "postman-lite-copilot-extension.openPostmanLite", // Use the command name from your package.json
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
          retainContextWhenHidden: true, // Keep the state of the webview even when it's hidden
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
      } catch (error: any) {
        vscode.window.showErrorMessage(
          `Failed to load webview HTML: ${error.message}`
        );
        console.error(`Error reading ${webviewPath}:`, error);
        return;
      }

      panel.webview.html = htmlContent;

      // Send the API key to the webview immediately after it's loaded
      // This ensures the webview has the key as soon as possible.
      panel.webview.postMessage({
        command: "sendGeminiApiKey",
        apiKey:
          vscode.workspace
            .getConfiguration("postmanLite")
            .get<string>("geminiApiKey") || "",
      });

      // Handle messages from the webview
      panel.webview.onDidReceiveMessage(
        async (message: WebviewMessage) => {
          // Explicitly type the incoming message
          console.log(
            "Extension Host: Received command from webview:",
            message.command
          ); // NEW LOG
          switch (message.command) {
            case "alert": // Keep existing alert handler
              // Now TypeScript knows 'message' is of type AlertMessage here
              vscode.window.showInformationMessage(message.text);
              return;

            case "getGeminiApiKey":
              // This case is now less critical as the key is sent on panel load,
              // but can remain for explicit requests from webview if needed.
              console.log(
                "Extension Host: Handling explicit getGeminiApiKey request."
              ); // NEW LOG
              const config = vscode.workspace.getConfiguration("postmanLite");
              const geminiApiKey = config.get<string>("geminiApiKey");
              console.log(
                "Extension Host: Gemini API Key retrieved:",
                geminiApiKey ? "Set" : "Not Set"
              );

              panel.webview.postMessage({
                command: "sendGeminiApiKey",
                apiKey: geminiApiKey || "",
              });
              return;

            case "sendHttpRequest":
              try {
                const { method, url, headers, body } = message.data;
                console.log(
                  "Extension Host: Making HTTP request:",
                  method,
                  url
                ); // NEW LOG
                const options: RequestInit = {
                  method: method,
                  headers: headers as HeadersInit,
                };

                // Explicitly check if body is not null or undefined before stringifying
                if (
                  body !== null &&
                  body !== undefined &&
                  (method === "POST" || method === "PUT" || method === "PATCH")
                ) {
                  options.body = JSON.stringify(body);
                } else if (
                  body === null &&
                  (method === "POST" || method === "PUT" || method === "PATCH")
                ) {
                  // If body is explicitly null for POST/PUT/PATCH, set it to an empty string or handle as desired
                  options.body = "";
                }
                // If body is undefined, it won't be set, which is correct.

                const startTime = process.hrtime.bigint(); // High-resolution time
                const response = await fetch(url, options);
                const endTime = process.hrtime.bigint();
                const timeTaken = Number(endTime - startTime) / 1_000_000; // Convert nanoseconds to milliseconds

                const responseContentType =
                  response.headers.get("Content-Type");
                let responseData: string;

                // Handle different content types from the API response
                if (
                  responseContentType &&
                  responseContentType.includes("application/json")
                ) {
                  responseData = JSON.stringify(await response.json(), null, 2);
                } else if (
                  responseContentType &&
                  responseContentType.includes("text/")
                ) {
                  responseData = await response.text();
                } else {
                  // For other types (e.g., images, binary), convert to a readable format or base64 if necessary.
                  // For simplicity, we'll just get text for now, but this might need refinement.
                  responseData = `(Binary or unknown content type: \${responseContentType}) - \${await response
                    .text()
                    .substring(0, 200)}...`;
                }

                panel.webview.postMessage({
                  command: "httpResponse",
                  data: {
                    status: response.status,
                    statusText: response.statusText,
                    timeTaken: timeTaken.toFixed(2),
                    responseData: responseData,
                  } as HttpResponseData,
                });
              } catch (error: any) {
                // --- ADDED DETAILED LOGGING HERE ---
                console.error(
                  "HTTP Request Error caught in extension host:",
                  error
                );
                console.error("Error name:", error.name);
                console.error("Error message:", error.message);
                if (error.stack) {
                  console.error("Error stack:", error.stack);
                }
                if (error.code) {
                  // For Node.js specific errors like ECONNREFUSED
                  console.error("Error code:", error.code);
                }
                // --- END ADDED LOGGING ---

                panel.webview.postMessage({
                  command: "httpResponse",
                  data: {
                    error: {
                      message: error.message || "Unknown network error",
                    },
                  } as HttpResponseData,
                });
                vscode.window.showErrorMessage(
                  `HTTP Request Error: ${
                    error.message || "Unknown network error"
                  }`
                );
              }
              return;

            case "getGeminiSuggestion":
              try {
                const userPrompt: string = message.data.prompt;
                console.log(
                  "Extension Host: Received Gemini prompt:",
                  userPrompt
                ); // NEW LOG
                const config = vscode.workspace.getConfiguration("postmanLite"); // Use your configured section name
                const geminiApiKey: string = config.get("geminiApiKey", "");

                if (!geminiApiKey) {
                  console.warn(
                    "Extension Host: Gemini API Key is not set, cannot call AI."
                  ); // NEW LOG
                  panel.webview.postMessage({
                    command: "geminiResponse",
                    data: {
                      error: {
                        message:
                          "Gemini API Key is not set in VS Code settings.",
                      },
                    } as GeminiResponseData,
                  });
                  return;
                }

                let chatHistory: Array<{
                  role: string;
                  parts: Array<{ text: string }>;
                }> = [];
                chatHistory.push({
                  role: "user",
                  parts: [{ text: userPrompt }],
                });

                const payload = { contents: chatHistory };
                const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

                console.log("Extension Host: Calling Gemini API at:", apiUrl); // NEW LOG
                const geminiResponse = await fetch(apiUrl, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                });

                // Check if the response was OK (status 2xx) before trying to parse JSON
                if (!geminiResponse.ok) {
                  const errorText = await geminiResponse.text();
                  console.error(
                    `Extension Host: Gemini API returned non-OK status: ${geminiResponse.status} ${geminiResponse.statusText}. Response body: ${errorText}`
                  );
                  panel.webview.postMessage({
                    command: "geminiResponse",
                    data: {
                      error: {
                        message: `Gemini API Error: ${geminiResponse.status} ${
                          geminiResponse.statusText
                        }. Details: ${errorText.substring(0, 200)}...`,
                      },
                    } as GeminiResponseData,
                  });
                  return;
                }

                const geminiResult = await geminiResponse.json();
                console.log(
                  "Extension Host: Received Gemini response status:",
                  geminiResponse.status
                ); // NEW LOG
                console.log(
                  "Extension Host: Received Gemini result:",
                  JSON.stringify(geminiResult, null, 2)
                ); // NEW LOG

                if (
                  geminiResult.candidates &&
                  geminiResult.candidates.length > 0 &&
                  geminiResult.candidates[0].content &&
                  geminiResult.candidates[0].content.parts &&
                  geminiResult.candidates[0].content.parts.length > 0
                ) {
                  panel.webview.postMessage({
                    command: "geminiResponse",
                    data: {
                      aiText: geminiResult.candidates[0].content.parts[0].text,
                    } as GeminiResponseData,
                  });
                } else {
                  console.error(
                    "Extension Host: Unexpected AI response structure:",
                    geminiResult
                  ); // NEW LOG
                  panel.webview.postMessage({
                    command: "geminiResponse",
                    data: {
                      error: {
                        message:
                          "Sorry, I could not generate a response from AI. Unexpected structure.",
                      },
                    } as GeminiResponseData,
                  });
                }
              } catch (error: any) {
                console.error(
                  "Extension Host: Error calling Gemini API from extension host:",
                  error
                ); // NEW LOG
                panel.webview.postMessage({
                  command: "geminiResponse",
                  data: {
                    error: {
                      message: `An error occurred while connecting to the AI: ${error.message}`,
                    },
                  } as GeminiResponseData,
                });
              }
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
