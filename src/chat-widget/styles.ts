export function getStyles(): string {
  return `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }

    .tc-chat-container {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-size: 14px;
      line-height: 1.5;
      color: #1a1a1a;
    }

    .tc-chat-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #1a1a1a;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: transform 0.2s, box-shadow 0.2s;
      position: relative;
    }

    .tc-chat-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }

    .tc-chat-btn svg {
      width: 24px;
      height: 24px;
    }

    .tc-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #ef4444;
      color: white;
      font-size: 11px;
      font-weight: 600;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }

    .tc-badge:empty { display: none; }

    .tc-chat-window {
      position: absolute;
      bottom: 72px;
      right: 0;
      width: 380px;
      height: 520px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      border: 1px solid #e5e5e5;
    }

    .tc-chat-window.hidden { display: none; }

    .tc-chat-header {
      padding: 16px;
      background: #1a1a1a;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .tc-chat-header-title {
      font-weight: 600;
      font-size: 15px;
    }

    .tc-chat-header-status {
      font-size: 12px;
      opacity: 0.7;
    }

    .tc-chat-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 4px;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .tc-chat-close:hover { opacity: 1; }

    .tc-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tc-msg {
      max-width: 80%;
      padding: 10px 14px;
      border-radius: 12px;
      word-wrap: break-word;
      font-size: 14px;
    }

    .tc-msg-customer, .tc-msg-visitor {
      align-self: flex-end;
      background: #1a1a1a;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .tc-msg-agent {
      align-self: flex-start;
      background: #f3f4f6;
      color: #1a1a1a;
      border-bottom-left-radius: 4px;
    }

    .tc-msg-system {
      align-self: center;
      background: #fef3c7;
      color: #92400e;
      font-size: 12px;
      padding: 6px 12px;
    }

    .tc-msg-label {
      font-size: 11px;
      opacity: 0.6;
      margin-bottom: 2px;
    }

    .tc-chat-input-area {
      padding: 12px 16px;
      border-top: 1px solid #e5e5e5;
      display: flex;
      gap: 8px;
    }

    .tc-chat-input {
      flex: 1;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 14px;
      outline: none;
      font-family: inherit;
      resize: none;
    }

    .tc-chat-input:focus {
      border-color: #1a1a1a;
    }

    .tc-chat-send {
      background: #1a1a1a;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 8px 16px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }

    .tc-chat-send:hover { background: #333; }
    .tc-chat-send:disabled { opacity: 0.5; cursor: not-allowed; }

    .tc-loading {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #9ca3af;
    }

    .tc-empty {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: #9ca3af;
      font-size: 13px;
    }

    @media (max-width: 480px) {
      .tc-chat-window {
        width: calc(100vw - 32px);
        height: calc(100vh - 120px);
        bottom: 72px;
        right: -8px;
      }
    }
  `
}
