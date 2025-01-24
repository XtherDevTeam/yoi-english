import React, { useState, useEffect } from "react";
import fs from "../fs";
import Api from "../Api";
import { monaco } from 'react-monaco-editor';
import MonacoEditor from "react-monaco-editor";

const ArticleEditor = ({ height, width, mode, language, value, onChange, options, enableArtifactUpload, onErr }) => {
  const editorRef = React.useRef(null);
  const pastePosition = React.useRef(null);
  return <MonacoEditor
    height={height}
    width={width}
    theme={mode == "dark" ? "vs-dark" : "vs"}
    language={language}
    value={value}
    onChange={onChange}
    options={{
      minimap: { enabled: false },
      wordWrap: "on",
      ...options
    }}
    editorDidMount={(editor, monaco) => {
      // bind editorRef
      editorRef.current = editor;
      // bind onPaste
      if (enableArtifactUpload) {
        console.log('enableArtifactUpload');
        editor.onDidPaste((e) => {
          console.log('onDidPaste');
          pastePosition.current = e.range;
          console.log(pastePosition.current);
        });

        editor.getDomNode().addEventListener('paste', (e) => {
          console.log('paste');
          e.preventDefault();
          let selection = editorRef.current.getSelection();
          const items = e.clipboardData.items;
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile();
              // upload to artifact
              fs.uploadAsync(Api.artifactCreateUrl(), file, {}).then(response => response.json().then(data => {
                if (data.status) {
                  let url = Api.getArtifactDownloadUrl(data.data.id);
                  editor.executeEdits("", [
                    {
                      range: new monaco.Range(pastePosition.current.startLineNumber,
                        pastePosition.current.startColumn,
                        selection.endLineNumber,
                        selection.endColumn,
                      ),
                      text: `![](${url})`
                    }
                  ]);
                  let { endLineNumber, endColumn } = editorRef.current.getSelection()
                  editorRef.current.setPosition({ lineNumber: endLineNumber, column: endColumn })
                } else {
                  onErr(data.message);
                }
              }).catch(err => {
                onErr('Network error');
              })).catch(err => {
                onErr('Network error');
              });
            }
          }
        });
      }
    }}
  />
}

export default ArticleEditor;