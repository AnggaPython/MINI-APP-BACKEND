# CCPayment V2 API — Complete Reference & Integration Guide

> **Source**: Compiled from the official CCPayment API documentation at https://ccpayment.com/api/doc (sections: Introduction, API Integration Guide, API Documentation). All information is faithful to the source. The V1 API has been deprecated — always use the V2 API.

> **Base URL for all API endpoints**: `https://ccpayment.com/ccpayment/v2`

> **How to use this document (for AI agents)**: Section 2 explains how to choose an integration mode. Sections 3–5 cover credentials, authentication, and webhooks — required for every integration. Section 6 gives step-by-step integration workflows per mode and per industry. Sections 7–11 are the complete endpoint reference (every parameter, response field, and webhook). Section 13 lists all status/error codes. Section 14 is a one-page endpoint index.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [How to Choose the Right Integration Mode](#2-how-to-choose-the-right-integration-mode)
3. [Quick Start — Credentials, Authentication & Specifications](#3-quick-start--credentials-authentication--specifications)
4. [Testnet](#4-testnet)
5. [Webhooks](#5-webhooks)
6. [API Integration Guide (Workflows & Use Cases)](#6-api-integration-guide-workflows--use-cases)
7. [Deposit APIs](#7-deposit-apis)
8. [Withdrawal APIs (Single & Batch)](#8-withdrawal-apis-single--batch)
9. [Swap APIs](#9-swap-apis)
10. [Create a Wallet System (User-Level APIs)](#10-create-a-wallet-system-user-level-apis)
11. [Common APIs](#11-common-apis)
12. [Support — FAQ & Contact](#12-support--faq--contact)
13. [Status Codes & Error Codes](#13-status-codes--error-codes)
14. [Complete API Endpoint Index](#14-complete-api-endpoint-index)
15. [AI Tools & Resources](#15-ai-tools--resources)

---

## 1. Introduction

CCPayment is a cryptocurrency payment platform allowing merchants to accept and pay out cryptocurrencies with the lowest fees on the market. It is a unified cryptocurrency payment gateway tailored for global businesses: the platform supports over 900 cryptocurrencies, featuring transparent processing fees as low as 0.2%. Through diverse services including APIs, Quick Payment, and Hosted Checkout, merchants can effortlessly integrate the gateway into existing websites or e-commerce platforms without extensive technical expertise.

Security and compliance: CCPayment incorporates military-grade data encryption, internationally compliant Anti-Money Laundering (AML) risk management, along with API key and Two-Factor Authentication (2FA) mechanisms — establishing a robust, tamper-proof, fraud-resistant, and leak-proof digital asset security framework for merchants.

Support: 24/7 customer support via live chat, email, and phone.

**Reading Path Guide**

| Your Role | Recommended Reading Path | Objective |
|-----------|--------------------------|-----------|
| Business Decision Makers / Executives | "How to Choose an Integration Model" → "Use Cases" | Quickly determine which integration option fits your business |
| Technical Integration Staff | "Quick Start Guide" → the section for your chosen integration mode | Complete technical integration and testing step by step |

---

## 2. How to Choose the Right Integration Mode

Are you looking to accept payments directly (e-commerce/retail), provide asset management for users (wallets/exchanges), or maintain long-term customer relationships (membership top-ups)? Identify the most suitable integration solution based on your business scenario:

| Mode Name | Core Features | Suitable Business Types |
|-----------|---------------|-------------------------|
| **Permanent Address Mode** | 1. The system assigns an exclusive permanent deposit address to each of your users. 2. Fund flow: upon user deposit, funds are credited directly to **your merchant balance**. | Membership platforms, long-term service subscriptions, personal transfer services. Example: a gaming platform where users remember their unique deposit address and top up whenever they wish to play. |
| **Retail Checkout Mode** (Order Mode) | 1. One-time address: a unique address is generated for each checkout, valid only for that transaction. Supports automated reconciliation. 2. Fund flow: funds from each transaction are credited to **your merchant balance**. | Cross-border e-commerce, SaaS software sales, digital content monetization, retail goods. Example: an e-commerce website where users place an order and pay the product price at checkout. |
| **Wallet Mode** (User Wallet System) | 1. The system assigns an exclusive permanent deposit address to each of your users. 2. Fund flow: upon user deposit, funds are credited to **the user's balance** (not the merchant's). 3. Free internal transfer: zero-fee fund transfers between users within the system. | Cryptocurrency exchanges, Web3 social platforms, asset custody platforms. Example: a cryptocurrency wallet app or asset management platform. |

Decision shortcuts:

- Deposits tied to **orders with fixed amounts** → Retail Checkout Mode → Section 7.2–7.5.
- Deposits tied to **users, credited to merchant balance** → Permanent Address Mode → Section 7.1.
- Deposits tied to **users, credited to per-user balances** (with user withdrawals, internal transfers, user swaps) → Wallet Mode → Section 10.
- **Batch Withdrawal** (Section 8.5) works only on the merchant master balance. It is available in Permanent Address Mode and Retail Checkout Mode. In Wallet Mode, user balances must be paid out via the dedicated User Withdrawal APIs (Section 10.3) — Batch Withdrawal does not support wallet mode user balances.

---

## 3. Quick Start — Credentials, Authentication & Specifications

### 3.1 Credentials

To establish communication with CCPayment systems, you need credentials for your terminals:

1. **Step 1**: Go to the CCPayment registration page and sign up using your email address (https://console.ccpayment.com).
2. **Step 2**: Log in and navigate to **Dashboard > Developer** to obtain your **"APP ID"** and **"APP Secret"**, which serve as your credentials to communicate with CCPayment.

You will need the APP ID and APP Secret to sign every message sent to CCPayment.

**Before signing, check the following**:

1. Ensure the APP ID and APP Secret are correct (check on Dashboard > Developer). Note: if you use a random APP ID for unauthorized actions, CCPayment will block the IP and APP ID after a number of requests.
2. If you have set up an IP whitelist on Dashboard > Developer, ensure the IP address of your requests is included in the whitelist.

### 3.2 Rules for API Calls

| Rule | Description |
|------|-------------|
| Transfer Mode | HTTPS |
| Submit Mode | POST (may vary for different APIs) |
| Content-Type | Application/Json |
| Char Encoding | UTF-8 |
| Signature Algorithm | HmacSHA-256 (RSA also supported) |

### 3.3 Request Headers (required on every request)

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Appid | String | Yes | Your CCPayment APP ID |
| Timestamp | String | Yes | 10-digit timestamp (Unix seconds). Valid within 2 minutes. Example: `1677152720` |
| Sign | String | Yes | HMAC-SHA256 hex signature or RSA Base64 signature. HMAC example: `871f0223c66ea72435208d03603a0cb00b90f6ac4a4ba725d00164d967e291f6` |
| User-Agent | String | Yes | **A standard User-Agent field is strictly required** to pass CCPayment's security gateway (e.g., `User-Agent: CCPayment-Client/1.0` or a standard browser UA). Missing or invalid User-Agent may result in a **403 Forbidden** error. |

Headers for all requests made to CCPayment follow the same rule.

### 3.4 Signature Algorithm

Prepare a `signText` by concatenating appId and timestamp, and append the request payload if present:

```
signText = {Appid} + {Timestamp} + {Payload in JSON format}
(if the request body is empty: signText = {Appid} + {Timestamp})
```

- **HMAC (default)**: Use the SHA-256 hashing algorithm to compute the HMAC signature of `signText` with your APP Secret as the key; hex-encode the result.
- **RSA (alternative)**: Use the RSA private key to sign the SHA-256 hashed data, and convert the signature into a Base64-encoded string.

Rules:
- The payload of the request must be a JSON object.
- **The payload you sign must be exactly the same as the payload you send in the request.**
- The timestamp is a 10-digit Unix timestamp in seconds.

HMAC one-liner example:

```javascript
var sign = CryptoJS.HmacSHA256('The quick brown fox jumped over the lazy dog.', appSecret).toString();
```

### 3.5 Full Request Examples (Node.js)

**HMAC — endpoint without parameters (getCoinList)**:

```javascript
const https = require('https');
const crypto = require('crypto');

const appId = '*** your appId ***';
const appSecret = '*** your appSecret ***';

const path = 'https://ccpayment.com/ccpayment/v2/getCoinList';
const args = ''; // empty body

const timestamp = Math.floor(Date.now() / 1000);
let signText = appId + timestamp;
if (args) {
  signText += args;
}

const sign = crypto.createHmac('sha256', appSecret).update(signText).digest('hex');

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Appid': appId,
    'Sign': sign,
    'Timestamp': timestamp.toString(),
    'User-Agent': 'CCPayment-Client/1.0',
  },
};

const req = https.request(path, options, (res) => {
  let respData = '';
  res.on('data', (chunk) => { respData += chunk; });
  res.on('end', () => { console.log('Response:', respData); });
});

req.write(args);
req.end();
```

**HMAC — endpoint with parameters (getCoin)**: identical to the above, but set:

```javascript
const path = 'https://ccpayment.com/ccpayment/v2/getCoin';
const args = JSON.stringify({ "coinId": 1280 });
```

**RSA signature example**:

```javascript
// Prepare data to be signed
const dataToSign = apiID + timestamp + apiParams;

// Load the private key
const privateKey = crypto.createPrivateKey(privateKeyPem);

// Sign the data
const sign = crypto.createSign('SHA256');
sign.update(dataToSign);
sign.end();

const signature = sign.sign(privateKey, 'base64');
// Send with headers: Appid, Sign (= signature), Timestamp, User-Agent
```

### 3.6 Request Limits

Check the specific interface documentation to know the exact rate-limit information. Error code `11004` means you have reached the rate limit. To increase the limit, contact your CCPayment account manager.

---

## 4. Testnet

If you would like to test your integration with test currencies, use **ETH Sepolia**:

1. Navigate to **CCPayment Dashboard > Merchant settings > ETH test network** and turn the switch on.
2. Get free test Sepolia ETH from faucets:
   - https://cloud.google.com/application/web3/faucet/ethereum/sepolia
   - https://sepolia-faucet.pk910.de
   - https://www.allthatnode.com/faucet/ethereum.dsrv
   - https://faucet.quicknode.com/drip
3. Check transaction details on the blockchain explorer: `https://sepolia.etherscan.io/[your txid]`

**When you finish testing and debugging, switch the ETH test network off.** Testing Sepolia ETH has no real value; it is only for testing purposes.

---

## 5. Webhooks

CCPayment notifies you of real-time transaction statuses by sending webhooks to your server. When your server receives a webhook request, it can parse the payload and perform corresponding operations (e.g., updating order status, generating shipping notifications).

### 5.1 Webhook Guide (scope)

**Deposits of coins in the "Tokens for your business" list will have webhook notifications sent. Deposits of non-supported coins for your business will NOT trigger webhooks.** Configure the list at **Dashboard > Settings > Tokens for your business**.

### 5.2 Set Webhook URL

Go to **Dashboard > Developer > Webhook URL** to set your webhook receiving URL.

If your server has an IP whitelist configured, add CCPayment's webhook sending IP: **`54.150.123.157`**

### 5.3 notifyUrl Domain Whitelist (optional, per-request webhook URL)

Go to **Dashboard > Developer > notifyUrl Domain Whitelist** to add your domain(s) (e.g., `abc.com`). Once configured, you can pass a custom `notifyUrl` (built from a whitelisted domain) when calling the APIs below, and the webhook for that specific API call will be sent to that URL.

APIs that support the `notifyUrl` parameter:

| API | Endpoint |
|-----|----------|
| Deposit with merchant-specified currency and network | `createAppOrderDepositAddress` |
| Deposit with customer-selected currency and network | `createInvoiceUrl` |
| Create or Get User Deposit Address | `getOrCreateUserDepositAddress` |
| Get Permanent Deposit Address | `getOrCreateAppDepositAddress` |
| Create Single Withdrawal Order | `applyAppWithdrawToNetwork` |
| User Withdrawal to Blockchain Address | `applyUserWithdrawToNetwork` |
| Initiate Batch Withdrawal | `applyBatchWithdraw` |

Special rule for `getOrCreateAppDepositAddress`: if you previously passed a `notifyUrl` for a specific address and the call succeeded, subsequent calls to this API for the same address **without** a new `notifyUrl` will still send webhooks to the previously used notifyUrl.

### 5.4 How to Handle Incoming Webhooks

**Step 1 — Verify the signature.** Always verify that the signature provided in the webhook matches the one you generate. Webhook request headers:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Appid | String | Yes | Your CCPayment APP ID |
| Timestamp | String | Yes | 10-digit timestamp. Valid within 2 minutes |
| Sign | String | Yes | Signature over `{Appid} + {Timestamp} + {Payload JSON}` |

- **HMAC verification**: use HMAC-SHA256 to generate the Sign value from `{Appid}+{Timestamp}+{payload}`. Compare with the Sign header. Equal → verification success, proceed. Not equal → verification failed; the request may have been tampered with.
- **RSA verification**: decode the Base64-encoded signature; use the RSA key to decrypt it; the decrypted data should reveal `{APP ID} + {Timestamp} + {Payload JSON object}`. Compare with the expected concatenation; match → success, mismatch → failed.

**Step 2 — Parse the payload.** Use the `recordId` or `referenceId`/`orderId` in the webhook payload to retrieve transaction details by calling the corresponding Get Record interface. **Credit users based on the transaction details returned by the interface**, not the webhook alone.

**Step 3 — Respond.** Set the response format to `Content-Type: text/plain; charset=utf-8` and return HTTP 200 with a `"Success"` string in the HTTP payload. When CCPayment receives the correct response, it stops pushing the notification.

Signature verification example (Node.js / Express):

```javascript
const express = require('express');
const crypto = require('crypto');
const app = express();
function verifySignature(content, signature, app_id, app_secret, timestamp) {
  let sign_text = `${app_id}${timestamp}${content}`;
  let server_sign = crypto.createHmac('sha256', app_secret).update(sign_text).digest('hex');
  return signature === server_sign;
}
app.use(express.text());
app.post('/webhook', (req, res) => {
  const app_id = 'your_app_id';
  const app_secret = 'your_app_secret';
  const timestamp = req.header('Timestamp');
  const sign = req.header('Sign');
  const sign_text = req.body;
  if (verifySignature(sign_text, sign, app_id, app_secret, timestamp)) {
    res.send('success');
  } else {
    res.status(401).send('Invalid signature');
  }
});
app.listen(3000);
```

### 5.5 Retry Logic

If CCPayment does not receive HTTP 200 with a "Success" string in the response body, it retries up to 6 times at these intervals:

| Retry | Interval |
|-------|----------|
| 1st | 30 seconds |
| 2nd | 1 minute 30 seconds |
| 3rd | 3 minutes 30 seconds |
| 4th | 7 minutes 30 seconds |
| 5th | 15 minutes 30 seconds |
| 6th | 31 minutes 30 seconds |

### 5.6 Idempotency Implementation (CRITICAL)

To prevent duplicate transactions caused by network issues or webhook retry mechanisms, merchants **must** implement idempotency to ensure each transaction is processed only once.

- **Basis for checking**: use the unique transaction identifier (CCPayment's `recordId`) as the basis for idempotency checks.
- **Processing solution**: upon receiving a deposit notification, first check whether the transaction has already been recorded in your database using the record ID. If it exists, skip processing to avoid duplicate crediting.

```javascript
if (db.includes(txId)) {
  console.log("Transaction has already been processed");
} else {
  // business processing logic
  // record transaction to db
}
```

**Disclaimer (from CCPayment)**: Merchants are strongly advised to implement idempotency logic in their business systems to safeguard funds. Merchants are responsible for maintaining their own accounting logic. CCPayment shall not be held liable for any duplicate credits resulting from the merchant's failure to implement idempotency.

### 5.7 Webhook Types

| Type | Trigger |
|------|---------|
| `DirectDeposit` | Deposit to a permanent address (merchant-level) |
| `ApiDeposit` | Deposit to an order-based address or invoice (checkout) address |
| `ApiWithdrawal` | Merchant-level network withdrawal status change |
| `ApiBatchWithdrawal` | Batch withdrawal master-order or sub-order status change |
| `UserDeposit` | Deposit to a user wallet address (Wallet Mode) |
| `UserWithdrawal` | User wallet network withdrawal status change |
| Risky Address webhook | A deposit address has been flagged as risky (special payload, see 5.9) |

No webhooks are sent for: withdrawals to Cwallet accounts, user internal transfers, and swaps. Confirm those via their respective Get Record endpoints (or the API response code for internal transfers/swaps).

### 5.8 Transaction Statuses in Webhooks

| Status | Meaning |
|--------|---------|
| `Processing` | Blockchain is processing the transaction |
| `Success` | The transaction has been confirmed |
| `Failed` | The transaction was not completed and the funds were not received |
| `WaitingApproval` | Withdrawal is waiting manual approval (only if merchant enabled withdrawal approval on the dashboard) |
| `Rejected` | Withdrawal request has been rejected by the merchant (only if approval is enabled) |

### 5.9 Risky Transactions & Risky Address Webhook

If a payment's `isFlaggedAsRisky` is `true`, CCPayment will NOT automatically credit the amount to your CCPayment account. Process the amount at **Dashboard > Transaction > Risky Transaction**. **CCPayment strongly recommends not automatically crediting risky payments to your users' accounts.** After processing, you can choose to credit the user or refund the payment manually.

**Risky Address webhook**: risky addresses are immediately disabled. CCPayment sends a webhook when an address has been flagged as risky. Deposits to flagged addresses will not trigger automatic webhook notifications; you can manually send webhooks from the dashboard for those deposits.

| Parameter | Type | Description |
|-----------|------|-------------|
| chainId | String | Chain ID |
| address | String | The receiving address flagged as risky |
| riskAt | Integer | Timestamp when the address was flagged |

After receiving this webhook, promptly inform your clients to stop depositing to the flagged address and call the Address Unbinding API (Section 7.6) to unbind the address.

### 5.10 Webhooks Are Notifications Only (CRITICAL)

The webhook is for transaction status notification only. After receiving a webhook, **always call the corresponding Get Record / Get Order Information API to confirm the actual payment status**. Do not treat the webhook status as the final status — this may result in asset loss. CCPayment is not responsible for losses resulting from incorrect integrations.

### 5.11 View Webhook Logs / Resend from Dashboard

Navigate to **Dashboard > Webhook** to view webhook logs. You can also resend one webhook or multiple webhooks in batch on this page.

### 5.12 Resend Webhook by Calling API

Resend webhooks for transactions within a specified time period.

**POST** `https://ccpayment.com/ccpayment/v2/webhook/resend`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordIds | Array | No | Specific record IDs to resend. Maximum 50 webhooks per batch |
| startTimestamp | Integer | Yes | Resend webhooks for all transactions created after this time. 10-digit timestamp |
| endTimestamp | Integer | No | Resend webhooks for transactions created before this time. 10-digit timestamp. If empty, resends webhooks for transactions within 1 hour after start time. Max difference between end and start: **1 hour** |
| webhookResult | String | No | `Failed` (default): only resend failed webhooks in the range. `AllResult`: resend all webhooks in the range |
| transactionType | String | No | `AllType` (default), `ApiDeposit`, `DirectDeposit`, `ApiWithdrawal`, `UserDeposit`, `UserWithdrawal` |

Response: `data.resendCount` (Integer) — number of webhooks successfully resent.

```json
{ "code": 10000, "msg": "Success", "data": { "resendCount": 1 } }
```

---

## 6. API Integration Guide (Workflows & Use Cases)

This section maps business scenarios to concrete API call sequences. Endpoint names refer to the reference sections 7–11.

### 6.1 Permanent Address Mode Integration

- **Integration**: By passing the `referenceId` and the `chain`, merchants can generate and bind a permanent static deposit address for a specific user. Users can subsequently deposit funds to this address at any time, and the funds will be automatically credited to the **merchant's** account. → `getOrCreateAppDepositAddress` (Section 7.1)
- **Unbind User Address**: When a user's account status changes (e.g., account cancellation, security risk management, or the need to generate a new address), call the unbinding API with the relevant address details to unbind the address from its corresponding referenceId. Deposits to old addresses will still be credited. To ensure fund security, CCPayment strongly recommends you stop depositing to any address that has been unbound. → `addressUnbinding` (Section 7.6)
- **Get Deposit Records or List**: Designed for data reconciliation between the merchant's system and the CCPayment platform. Batch-retrieve historical deposit details filtered by time range, user ID, or transaction hash (txId). Although CCPayment provides real-time webhook notifications, merchants should still set up a **scheduled reconciliation mechanism (poll/reconcile)** and regularly call this API to prevent missing transactions caused by network anomalies. → `getAppDepositRecord` / `getAppDepositRecordList` (Sections 7.7–7.8)
- **Create Withdrawal Order**: CCPayment provides two interfaces — Single Withdrawal and Batch Withdrawal. Initiate withdrawal requests via either, and record the platform record ID returned for subsequent tracking. → Sections 8.1–8.5
- **Create Swap Order**: One-stop asset swap service — real-time quotes for trading pairs, creating swap orders, and querying swap history records. → Section 9

### 6.2 Retail Checkout Mode Integration

- **Integration**: For e-commerce, retail, and single-order payment scenarios. Two mainstream modes:
  1. **Merchant-Specified Currency Mode**: When creating an order, the merchant explicitly specifies the cryptocurrency and network the user must pay with (e.g., 10 USDT-TRC20). The system returns a dedicated deposit address for that specific order — suitable for merchants building a minimal custom checkout UI. → `createAppOrderDepositAddress` (Section 7.2)
  2. **User-Selected Currency Mode (Hosted Checkout)**: The merchant only passes the fiat or token amount; CCPayment generates a secure hosted checkout page URL. Users freely select any cryptocurrency/network they hold to pay. The exchange rate is calculated and locked by the platform in real time, significantly reducing development costs. → `createInvoiceUrl` (Section 7.4)
- **Get Deposit Records or List**: Same reconciliation guidance as 6.1 — use webhooks in real time, and periodically call the record APIs as a scheduled reconciliation mechanism to prevent missed orders.
- **Create Withdrawal Order**: Single Withdrawal or Batch Withdrawal after risk control and security confirmation; record the returned record ID for tracking.
- **Create Swap Order**: Same one-stop swap service as 6.1.

### 6.3 User Wallet Mode Integration

CCPayment does **not** integrate with merchants' user account systems — it only provides technical support for user wallets; **compliance and ownership of user data are fully managed by the merchant**. When calling the API, merchants only pass the unique user identifier from their own system (e.g., `userId`) to create a virtual account for that entity within CCPayment — a high degree of customization and flexibility.

This mode is designed for building a complete closed-loop ecosystem. The platform provides a comprehensive suite of independent APIs — covering deposits, withdrawals, transfers, and swaps (Section 10). By configuring `extraFeeRate` in user-level swap APIs, merchants can charge a custom service fee on each transaction; all additional fees are credited directly to the merchant account, enabling extra monetization.

**Note: Batch Withdrawal does not currently support wallet mode.**

### 6.4 Batch Withdrawal Overview

Batch Withdrawal is a **merchant-level** fund disbursement tool designed to efficiently transfer cryptocurrencies from your merchant master balance to external addresses in bulk — suitable for supplier settlements, employee payroll, and merchant withdrawals.

**Applicability by integration model**:

| Integration Model | Applicability |
|-------------------|---------------|
| Permanent Address Mode / Retail (Acquiring) Mode | User deposits and customer payments are credited directly to your merchant master balance upon arrival. You may call this interface at any time to perform batch withdrawals, transfers, or disbursements of these settled revenues. |
| User Wallet System | This interface can only access **merchant-owned assets**. It cannot process or deduct balances from individual user wallets. To handle user withdrawal requests in this model, use the dedicated User Withdrawal interface (requires a mandatory User ID parameter). |

**Standard batch withdrawal workflow** (endpoints in Section 8.5):

1. **Address Validation** (optional but strongly recommended): call `checkWithdrawAddress` to validate all payout addresses in bulk, passing a unique `seq` for each entry. The platform intercepts address format errors (14007), invalid memo formats (14025), and blacklisted addresses (14029) before any funds are moved.
2. **Initiate Batch Withdrawal**: call `applyBatchWithdraw` to create the master order. Two key decisions: (a) assign a unique `batchOrderId` in your own system for downstream tracking; (b) choose the execution mode — `Batch`: all sub-orders are packaged and submitted to the chain together; faster, but individual sub-orders cannot be canceled once the order enters Processing (best for finalized airdrop lists and fixed contributor payouts). `Single`: sub-orders are submitted one by one; slower, but supports cancellation of individual sub-orders during execution (best when recipient eligibility may change mid-execution). The initial call supports up to **50 sub-orders**; append more via `appendBatchWithdraw` in batches of up to **100**, with a hard cap of **500 sub-orders** per master order. Once created, the master order enters `Init` status — you have **30 minutes** to confirm, or the order expires automatically.
3. **Confirm Batch Withdrawal**: call `confirmBatchWithdraw` with `confirmExecution: true` to lock the sub-order list and trigger the withdrawal flow. The response returns the total amount, networkFee, and coin pricing — review these before confirming. The master order transitions from `Init` to `Reviewing`/`WaitingApproval` (if your account has an approval workflow enabled), or directly to `Pending`. To abort before confirmation, call `confirmBatchWithdraw` with `confirmExecution: false` (only valid while the order is still `Init`).
4. **Mid-Execution Control**: for `Batch` mode, termination is supported while the master order is in `WaitingApproval` or `Pending` status; once it enters `Processing` it can no longer be stopped. For `Single` mode, you have additional control during `Processing`: call `abortBatchWithdraw` with specific `orderIds` to cancel individual sub-orders (e.g., a recipient's address is flagged by risk control mid-execution). If `orderIds` is omitted, all remaining unprocessed sub-orders are canceled.
5. **Reconciliation**: CCPayment pushes `ApiBatchWithdrawal` webhooks on master-order status changes and individual sub-order completions. Proactively poll master order status via `getBatchWithdrawOrder` (`verbose: 1` for status + stats summary; `verbose: 3` for full detail including coin pricing and network fee breakdown). For per-recipient auditing (e.g., payout receipts), paginate through `getBatchWithdrawOrderRecordList` using `nextId` cursor pagination. For any sub-order with `status: Failed`, surface the `reason` field to your operations team for manual review. **A failed sub-order does not block the remaining sub-orders from completing.**

### 6.5 Utilities

To reduce system development and operational overhead, CCPayment provides a comprehensive suite of public basic-data query APIs: token lists, token details, token prices, asset balances, address verification, network fees, supported swap tokens, blockchain information, auto-withdrawal records, risk refunds, and more. → Section 11.

### 6.6 Use Cases by Industry

#### 6.6.1 AI & OPC Business

If you are building an AI product — a subscription-based AI assistant, an autonomous agent that pays for compute or API resources on its own, or a platform that distributes token rewards to AI contributors — a programmatic, human-free payment infrastructure is essential. AI products operate across borders and serve users who may not have access to traditional banking; crypto payments remove geographic friction entirely. AI agents need to send and receive funds without manual intervention — CCPayment's API-first architecture makes the payment layer fully programmable, so an agent can act as an independent economic participant. Two primary integration paths: **Retail Checkout Mode** for subscription and pay-per-use billing, and **User Wallet System Mode** for platforms that manage agent or user balances independently.

**1. Deposit APIs (Subscription Billing & Pay-Per-Use)**:

- Step 1 — Asset Discovery: call `getCoinList` for supported coinId/chain combinations; call `getFiatList` to resolve the fiatId of your pricing currency (e.g., USD).
- Step 2 — Order Creation (choose one): **Option A — Fixed-Coin Invoice (merchant-specified)**: best for locking users to a specific payment token or rendering a native checkout UI; call `createAppOrderDepositAddress` — you receive a deposit address and the exact crypto amount; set `generateCheckoutURL: true` to let CCPayment host the checkout page. **Option B — Multi-Coin Invoice (customer-selected)**: best for global user bases holding diverse cryptocurrencies (maximizes conversion); call `createInvoiceUrl` — you receive an `invoiceUrl` to redirect the user to a hosted checkout page.
- Step 3 — Payment Monitoring: CCPayment monitors the on-chain transaction and credits your merchant balance once required confirmations are met.
- Step 4 — Order Reconciliation (crucial security step): you will receive an `ApiDeposit` webhook. **Do not trust a webhook alone.** Verify the webhook signature, then confirm by calling `getAppOrderInfo` (merchant-specified) or `getInvoiceOrderInfo` (customer-selected). Only activate the subscription or credit API usage tokens if status is `Success` and `isFlaggedAsRisky` is `false`.
- Step 5 — Fulfillment: fully paid → activate the subscription tier or credit the user's API usage balance immediately. Underpaid or overdue → do not auto-fulfill; flag for manual review.

**2. Deposit APIs (Agent Wallet Funding — User Wallet System Mode)**:

- Step 1 — Agent Identity Setup: assign a unique `userId` to each agent; call `getOrCreateUserDepositAddress` to generate a dedicated deposit address for that agent.
- Step 2 — Fund the Agent Wallet: the agent's wallet is funded externally (by the platform operator or end user); CCPayment monitors the deposit and automatically credits the agent's isolated balance.
- Step 3 — Reconciliation: you will receive a `UserDeposit` webhook. Verify the signature, then call `getUserDepositRecord` to confirm the final status and check `isFlaggedAsRisky`. **Never credit an agent's spendable balance for a risky deposit.**

**3. Withdrawal APIs (Agent Payouts & Revenue Distribution)**:

- Step 1 — Address Validation & Fee Preview: validate the destination with `checkWithdrawalAddressValidity`; preview the network fee with `getWithdrawFee`.
- Step 2 — Execute Payout: on-chain → `applyAppWithdrawToNetwork`; to Cwallet (instant & free) → `applyAppWithdrawToCwallet`; batch payouts to multiple contributors → `applyBatchWithdraw` (up to 500 recipients in a single master order).
- Step 3 — Reconciliation: watch for the `ApiWithdrawal` webhook (or `ApiBatchWithdrawal` for batch). To confirm any final status, call `getAppWithdrawRecord`.

**4. Swap APIs (Treasury & Volatility Protection)**:

- Option A — Auto-Swap (recommended): enable the "Auto-Swap of Deposit" feature in your merchant dashboard. No code required.
- Option B — Programmatic Swap: check rate via `estimate`; execute via `swap` (always pass `amountOutMinimum` for slippage protection); confirm via `getSwapRecord` and log `netAmountOut` for accounting.

#### 6.6.2 E-commerce & SaaS

Customers typically purchase a specific physical good, digital product, or a monthly subscription — one-time transactions with no need to maintain a continuous "platform balance". This industry primarily utilizes **Order Mode**: generate a time-limited checkout page or payment QR code with a fixed amount.

**1. Deposit APIs (Order Mode)**:

- Step 1 — Asset Discovery: `getCoinList` for coinId/chain values; `getFiatList` for the fiatId of your pricing currency (USD, EUR, ...).
- Step 2 — Order Creation (choose one): **Option A — Single-Coin Checkout (merchant-specified)**: strict control over coins/networks, or render the raw deposit address and QR code natively in your own UI → `createAppOrderDepositAddress` (set `generateCheckoutURL: true` if you still want CCPayment to host the checkout page). **Option B — Multi-Coin Invoice (customer-selected)**: ready-to-use hosted checkout page with maximum customer flexibility → `createInvoiceUrl` returns an `invoiceUrl`.
- Step 3 — Payment & Monitoring: the customer sends crypto; CCPayment monitors on-chain, applies the locked fiat exchange rate, and credits your merchant balance after required confirmations.
- Step 4 — Order Reconciliation (crucial): receive `ApiDeposit` webhook → verify signature → confirm via `getAppOrderInfo` or `getInvoiceOrderInfo`. Compare the paid value against the original price; classify the order as **fully paid, partially paid, overpaid, or overdue**.
- Step 5 — Fulfillment & Exception Handling: fully paid → fulfill immediately. Underpaid or overdue → do not auto-fulfill; flag for manual review. Note: the deposit address accepts funds for up to **7 days post-expiration**; such late payments are credited to your account — mark their status as "Overdue".

**2. Withdrawal APIs (Treasury Management)**: validate destination (`checkWithdrawalAddressValidity` or `getCwalletUserId`) → preview fee (`getWithdrawFee`) → execute (`applyAppWithdrawToNetwork` for on-chain, `applyAppWithdrawToCwallet` for instant zero-fee Cwallet transfer) → reconcile (watch `ApiWithdrawal` webhook; for Cwallet withdrawals, which send **no webhooks**, call `getAppWithdrawRecord`).

**3. Swap APIs (Volatility Risk Management)**: Option A — enable Auto-Swap of Deposit in the dashboard (hands-off). Option B — programmatic: `estimate` → `swap` with `amountOutMinimum` (swap fails if final output drops below this value) → `getSwapRecord` to confirm and log `netAmountOut`.

#### 6.6.3 Gaming & eSports

Players deposit funds frequently to exchange for in-game chips or points. This industry rarely uses checkout invoices — it relies on assigning stable, long-term deposit addresses to players. Two integration paths depending on backend architecture: **Permanent Address Mode** and **User Wallet System Mode**.

- **Step 1 — Asset Discovery (both modes)**: call `getCoinList` to enumerate supported coinId/chain combinations.
- **Step 2 — Choose Your Integration Architecture**:

**Option A: Permanent Address Mode (using your own platform ledger)**:

- Deposit: call `getOrCreateAppDepositAddress` with the player's unique identifier. CCPayment returns a permanent address (a memo is also returned for XRP, XLM, and TON chains) the player can reuse indefinitely. On payment you receive a `DirectDeposit` webhook — verify the signature, then confirm final status and `isFlaggedAsRisky` via `getAppDepositRecord`.
- Withdrawal (cashing out winnings): validate destination via `checkWithdrawalAddressValidity` or `getCwalletUserId`; preview fees via `getWithdrawFee`; execute on-chain via `applyAppWithdrawToNetwork` or off-chain (instant) via `applyAppWithdrawToCwallet`; reconcile via `ApiWithdrawal` webhook, and for Cwallet withdrawals confirm via `getAppWithdrawRecord`.
- Swap (merchant float management): rebalance platform float (e.g., stablecoins into distribution tokens): `estimate` → `swap` → `getSwapRecord`.

**Option B: User Wallet System Mode (using CCPayment as the underlying ledger)**:

- Deposit: call `getOrCreateUserDepositAddress` with the player's unique identifier. On payment you receive a `UserDeposit` webhook — verify signature, then confirm via `getUserDepositRecord` (check `isFlaggedAsRisky`).
- Withdrawal (user cashing out): liquidity check via `getUserCoinAsset`; fee preview via `getWithdrawFee`; execute via `applyUserWithdrawToNetwork` (on-chain) or `applyUserWithdrawToCwallet` (off-chain); reconcile via `UserWithdrawal` webhook and `getUserWithdrawRecord`.
- Swap & Internal Economy: player conversions inside their accounts — fetch rates (optionally applying your own markup via `extraFeeRate`) with `estimate`, execute via `userSwap`. Internal economy (real-money tournaments, tip systems, marketplaces) — instantly sweep entry fees or transfer funds between users for free via `userTransfer`.

- **Step 3 — Crucial Security & Maintenance**:
  - Security: regardless of mode, **never trust a webhook alone and never auto-credit a transaction flagged as risky** — always verify via the respective Get Record endpoints.
  - Address rotation: if a deposit address is flagged or a player asks to "rotate" their wallet for privacy, call `addressUnbinding` to release it; the next address-generation call will issue a fresh one.

#### 6.6.4 Digital Entertainment

Processing viewer tips, subscription payments, and creator revenue settlements requires managing multi-party fund flows. Three integration models:

**1. Deposit APIs (core funding scenarios)**:

- **Model A — Subscriptions and one-time top-ups (Order Mode)**: best for pay-per-view, monthly subscriptions, fixed-amount purchases. Call `getCoinList` and `getFiatList` to display supported currencies; use `createAppOrderDepositAddress` (with `generateCheckoutURL: true`) for fixed-price unlocking, or `createInvoiceUrl` for a standard checkout invoice. The exchange rate is locked, ensuring you receive the exact required fiat value. Reconciliation: `ApiDeposit` webhook → verify signature → confirm via `getAppOrderInfo` / `getInvoiceOrderInfo`. Only activate the subscription or unlock content if status is `Success` and `isFlaggedAsRisky` is `false`.
- **Model B — Permanent fan-funding addresses (Permanent Address Mode)**: best for direct creator support, long-term memberships, continuous donation streams. Call `getOrCreateAppDepositAddress` to generate a dedicated, reusable address for a creator or user profile; fans send funds anytime without generating a new invoice. Reconciliation: `DirectDeposit` webhook → verify signature → confirm via `getAppDepositRecord`. Only credit if `Success` and not risky.
- **Model C — Tips, gifts, in-app currency (User Wallet System Mode)**: best when CCPayment acts as the underlying ledger to isolate viewer and creator funds independently — ideal for high-frequency live-stream tipping and instant creator revenue splitting. Call `getOrCreateUserDepositAddress` with the viewer's/creator's unique identifier. Reconciliation: `UserDeposit` webhook → verify signature → confirm the final status, exact amount, and `isFlaggedAsRisky` via `getUserDepositRecord`; only update in-app balances once verified.

**2. Swap & Internal APIs (creator tips & consolidation)**:

- Instant tipping (Wallet System): viewers send tips during a livestream — `userTransfer` moves funds instantly from the viewer's userId to the creator's userId with zero fees; display history via `getUserTransferRecordList`.
- Consolidation (merchant swap): use the dashboard "Auto-Swap of Deposit" feature, or manually sweep and consolidate creator earnings into a single stablecoin before payout: `estimate` → `swap` → `getSwapRecord`.

**3. Withdrawal APIs (payouts to creators)**:

- Step 1 — validate the creator's destination address (`checkWithdrawalAddressValidity`) and quote the fee (`getWithdrawFee`).
- Step 2 — execute payout: **Option A (from merchant ledger — Order/Permanent modes)**: `applyAppWithdrawToNetwork` (on-chain) or `applyAppWithdrawToCwallet` (instant, zero network fee). **Option B (from creator's user wallet — Wallet System Mode)**: `applyUserWithdrawToNetwork` or `applyUserWithdrawToCwallet`.
- Step 3 — reconciliation & history: track `ApiWithdrawal` / `UserWithdrawal` webhooks. For Cwallet withdrawals (no webhooks) or to confirm final status, poll `getAppWithdrawRecord` / `getUserWithdrawRecord`.
- Step 4 — generate blockchain explorer link: show creators a payout history UI with the on-chain `txId`. Retrieve the chain's `baseUrl` (contains a `%s` placeholder) via `getChainList` (or from withdrawal record data) and replace `%s` with the `txId` to produce a clickable explorer link.

#### 6.6.5 Web3 & Creator Economy

Web3 projects (DAOs, decentralized task platforms, creator revenue hubs) involve high-frequency interactions and emphasize "personal asset sovereignty" — this industry primarily utilizes **User Wallet System Mode**. An independent underlying wallet per participant simplifies automated payouts and aligns with Web3 users' habits of isolated, transparent asset management.

**1. Deposit APIs (onboarding & community funding)**:

- Step 1 — Asset Discovery: `getCoinList` for deposit coins/chains; `getCoinUSDTPrice` to render real-time USD-equivalent values in your front end.
- Step 2 — Address Assignment: when a user joins, generate a unique `userId` and call `getOrCreateUserDepositAddress` for a personal, isolated deposit address.
- Step 3 — Payment & Monitoring: users fund wallets from external Web3 wallets (e.g., MetaMask) or centralized exchanges; CCPayment monitors the chain and credits the user's isolated balance.
- Step 4 — Order Reconciliation (crucial): `UserDeposit` webhook → verify signature → reconcile via `getUserDepositRecord` to confirm status and amount. Reject risky deposits (`isFlaggedAsRisky: true`) and refer them to your risk team; monitor `getRiskyRefundRecordList`.
- Step 5 — Portfolio Display: surface the user's portfolio via `getUserCoinAssetList`, pricing each line item with your frontend logic.

**2. Internal Transfer & Swap APIs (marketplaces, tipping & token conversions)**:

- Step 1 — Marketplace & Tipping (internal transfers): move funds instantly from a buyer/fan to a creator/escrow via `userTransfer` — instant, zero-fee, and **emits no webhook**. Split proceeds (royalties, DAO bounties) by batching independent internal transfers. Reconcile against `getUserTransferRecord`.
- Step 2 — In-Wallet Swaps (quote & markup): quote conversions via `estimate`, explicitly adding your platform fee using the `extraFeeRate` parameter. Display the `netAmountOut`, `fee`, and `extraFee`.
- Step 3 — Execute Swap: call `userSwap` with `amountOutMinimum` for slippage protection. The user's input balance is debited atomically, and the `extraFee` accrues directly to your merchant account.

**3. Withdrawal & Utility APIs (payouts & airdrops)**:

- Step 1 — Address Validation & Fee Preview: `checkWithdrawalAddressValidity` for external addresses; `getWithdrawFee` for gas estimation. For withdrawals to Cwallet, first validate the recipient via `getCwalletUserId`.
- Step 2 — Execute Payout: `applyUserWithdrawToNetwork` for on-chain payouts, or `applyUserWithdrawToCwallet` for instant zero-fee transfers.
- Step 3 — Reconciliation: track the `UserWithdrawal` webhook. For Cwallet withdrawals (no webhooks) or final checks, poll `getUserWithdrawRecord`.
- Step 4 — Explorer Link: retrieve the chain's `baseUrl` via `getChainList` and replace the `%s` placeholder with the `txId` for a clickable blockchain explorer link.

**4. Batch Operations APIs (batch withdrawals & payouts)**: follow the standard batch withdrawal workflow in Section 6.4 (validate addresses → initiate → confirm → mid-execution control → reconcile).

#### 6.6.6 Trading & Brokerage

Trading/brokerage platforms handling margin deposits, profit settlements, and asset exchanges demand strict fund segregation and accounting clarity. Mixing all user deposits into a single merchant master account complicates reconciliation — use the dedicated **User Wallet System Mode** to assign an independent asset account to each trader (standard "account opening and deposit" logic of financial brokerages).

**1. Deposit APIs (account funding)**:

- Step 1 — Asset Discovery: `getCoinList` + `getCoinUSDTPrice` for real-time USD-equivalent front-end display.
- Step 2 — Address Assignment: when a user selects a coin/chain pair, call `getOrCreateUserDepositAddress` with their unique `userId` for a per-user isolated deposit address (a memo is returned for XRP, XLM, and TON chains).
- Step 3 — Payment & Monitoring: the user funds the address from an external wallet or exchange; CCPayment monitors the chain and credits the user's CCPayment-managed isolated balance.
- Step 4 — Order Reconciliation (crucial): `UserDeposit` webhook → verify signature → call `getUserDepositRecord` to confirm final status, exact amount, and `isFlaggedAsRisky`. Reject risky deposits and route them to your compliance queue; **never auto-credit them**.
- Step 5 — Balance Sync: mirror the credited balance into your trading engine's ledger. Display portfolios via `getUserCoinAssetList` (or a single asset via `getUserCoinAsset`).

**2. Swap APIs (in-platform trading & revenue generation)**:

- Step 1 — Quote & Markup: call `estimate` with input/output coins and your `extraFeeRate`; display the net output and fees to the user as a quote.
- Step 2 — Execute Trade: on user confirmation, call `userSwap` with the same parameters, including `amountOutMinimum` for slippage protection. The user's input balance is debited and the output balance credited atomically. **This process is instant and has no webhook; success is determined by the API response code.**
- Step 3 — Trade History: persist trades in your platform history; let users audit via `getUserSwapRecordList`.

**3. Withdrawal APIs (off-platform cashout)**:

- Step 1 — Security & Balance Verification: confirm balance via `getUserCoinAsset`. **Always generate a 2FA/OTP challenge through your own auth stack before proceeding with any cash-out request.**
- Step 2 — Address Validation & Fee Preview: `checkWithdrawalAddressValidity` + `getWithdrawFee`.
- Step 3 — Execute Payout: on-chain → `applyUserWithdrawToNetwork`; off-chain (instant, zero-fee) → `applyUserWithdrawToCwallet`.
- Step 4 — Reconciliation: track the `UserWithdrawal` webhook (`Processing` → `Success`/`Failed`). To confirm any final state (especially Cwallet withdrawals, which emit no webhooks), poll `getUserWithdrawRecord`. On a `Failed` status, restore the user's balance and surface the reason.

**4. Treasury Operations (platform fund management)**:

- Step 1 — Sweep Funds (revenue collection): periodically sweep accumulated fee profits into your master merchant account via `userTransfer`, setting `toUserId` to your merchant **App ID**. This transfer is instant and completely free.
- Step 2 — Re-balance Treasury: manage master holdings via merchant-level swaps (`swap`).

---

## 7. Deposit APIs

### Which deposit API should I use?

| Use Case | Deposit Type | API |
|----------|-------------|-----|
| E-commerce / fixed-price orders, merchant specifies coin | Order-based (merchant-specified) | `createAppOrderDepositAddress` (7.2) |
| E-commerce, customer picks coin on hosted checkout page | Order-based (customer-selected) | `createInvoiceUrl` (7.4) |
| Gaming / streaming / social — user-linked deposits, credited to merchant balance | Permanent address | `getOrCreateAppDepositAddress` (7.1) |
| Wallet system with per-user balances | User deposit | `getOrCreateUserDepositAddress` (Section 10.2) |

---

### 7.1 Get Permanent Deposit Address

When you make a request with a `referenceId` and `chain` specified, CCPayment first checks if there is an existing permanent address associated with the given reference ID.

**Address handling**:
- **Existing address**: if a permanent address is already linked to the reference ID, CCPayment returns this address.
- **New address**: if no address is linked, CCPayment generates a new deposit address for that reference ID on the specified blockchain network and returns it.

Each APP ID can obtain **1000 addresses** via this interface. If you need more, contact customer service.

**POST** `https://ccpayment.com/ccpayment/v2/getOrCreateAppDepositAddress`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| referenceId | String | Yes | 3–64 characters. Unique reference ID for the user in your system |
| chain | String | Yes | Symbol of the chain. Call Get Token Information and use `data.coin[index].networks[chain].chain` to get the chain symbol. Example: `"chain": "TRX"` |
| notifyUrl | String | No | Custom URL to receive the webhook for this request; its domain must be in the notifyUrl Domain Whitelist. **Notice**: if you previously passed a notifyUrl for a specific address and the call succeeded, subsequent calls for the same address without a new notifyUrl still send webhooks to the previously used notifyUrl |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.address | String | Permanent deposit address |
| data.memo | String | For memo-required coins (XRP, XLM, etc.), the payer must fill in the correct memo to initiate the payment |

```json
{ "code": 10000, "msg": "success", "data": { "address": "0x7C631947c139F0163fECc0eef39f251D72dAE3B8", "memo": "" } }
```

**Webhook for Direct Deposit** — after receiving it, call Get Deposit Record (7.7) to confirm the deposit information:

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | `DirectDeposit` |
| msg.recordId | String | CCPayment unique ID for a transaction |
| msg.referenceId | String | Your unique reference ID for the user |
| msg.coinId | Integer | Coin ID |
| msg.coinSymbol | String | Coin symbol |
| msg.status | String | `Processing` / `Success` / `Failed` |
| msg.isFlaggedAsRisky | Boolean | `true`: risky — the amount will not be credited; process it at Transaction > Risky Transaction on the dashboard. `false`: not risky |

```json
{
  "type": "DirectDeposit",
  "msg": {
    "recordId": "2024031311310811...",
    "referenceId": "63224704901...",
    "coinId": 1329,
    "coinSymbol": "MATIC",
    "status": "Success",
    "isFlaggedAsRisky": false
  }
}
```

---

### 7.2 Deposit with Merchant-Specified Currency and Network (Create Deposit Order)

One of two order-based deposit methods. Merchants receive a webhook for every payment made to this address. This type of deposit is "API Deposit".

**POST** `https://ccpayment.com/ccpayment/v2/createAppOrderDepositAddress`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | Yes | Coin ID of the coin to pay |
| fiatId | Integer | No | If set, the product price is in the provided fiat; CCPayment converts the fiat value to coin amount and generates the address based on coinId. Retrieve fiatId via Get Fiat List |
| price | String | Yes | Product price — fiat or crypto. If `fiatId` is passed: fiat price (precision up to 2 decimal places). If `fiatId` empty: price is in the payment coin (precision up to 18 decimal places) |
| chain | String | Yes | Symbol of the chain |
| orderId | String | Yes | Order ID, 3–64 characters |
| expiredAt | Integer | No | 10-digit timestamp; order expires at this time. Default value is 10 days. Example: valid 30 min → `expiredAt = creation timestamp + 60*30`. **Before expiration the rate is locked.** Crypto markets are volatile — CCPayment recommends locking the rate for a relatively short period to prevent potential loss. After expiration, your account still receives all payments to the deposit address within 7 days |
| buyerEmail | String | No | CCPayment sends order and payment information to this email. It is not used for other purposes |
| generateCheckoutURL | Boolean | No | `true`: create a checkout URL for this order. `false` (default): do not create |
| product | String | No | Product name displayed on the checkout page. Only valid when a checkout URL is created. Max 120 characters |
| returnUrl | String | No | URL after successful payment (checkout page only) |
| closeUrl | String | No | URL after the buyer clicks "leave page" (checkout page only) |
| notifyUrl | String | No | Custom webhook URL for this request (domain must be whitelisted) |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.amount | String | Coin amount to pay |
| data.address | String | Deposit address. Your account can still receive deposits + webhooks for 7 days after expiration; such payments are credited with an "Overdue" status on the dashboard |
| data.memo | String | Memo for memo-required coins (XRP, XLM, etc.) |
| data.checkoutUrl | String | Only returned when a checkout URL is created; the payer pays on this page |
| data.confirmsNeeded | Integer | Required number of on-chain confirmations |

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "address": "0x9aBDDCE1EE18D1857C0653EB4a3Fa9d9E0dcd584",
    "amount": "0.008552856654122477",
    "memo": "",
    "checkoutUrl": "https://i.ccpayment.com/xxx",
    "confirmsNeeded": 50
  }
}
```

**Webhook for API Deposit** — after receiving it, call Get Order Information (7.3) to confirm order and payment:

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | `ApiDeposit` |
| msg.recordId | String | CCPayment unique transaction ID |
| msg.orderId | String | Your unique order ID |
| msg.coinId | Integer | Coin ID |
| msg.coinSymbol | String | Coin symbol |
| msg.status | String | `Processing` / `Success` / `Failed` |
| msg.isFlaggedAsRisky | Boolean | Risky-transaction flag (see 5.9) |

**CRITICAL**: The webhook is for status notification only. Call Get Order Information with the order ID from the webhook to confirm the actual payment status. Do not treat webhook status as the final order status — this may result in asset loss.

---

### 7.3 Get Order Information (Merchant-Specified Currency Deposit Order)

Retrieves order information and **all** deposit records associated with the provided Order ID. Use case: if there are multiple payments under one order, obtain all deposit records for that order and determine whether the order is **partially paid, overpaid, underpaid, or overdue**.

**POST** `https://ccpayment.com/ccpayment/v2/getAppOrderInfo`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | String | Yes | 3–64 characters. Unique ID for the order in your system |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.amountToPay | String | Coin amount to pay |
| data.coinId | Integer | Deposit coin ID specified by the order |
| data.coinSymbol | String | Deposit coin symbol specified by the order |
| data.chain | String | Deposit chain symbol specified by the order |
| data.toAddress | String | Deposit address (receives deposits + webhooks for 7 days after expiration; late payments credited with "Overdue" status) |
| data.toMemo | String | Memo for memo-required coins |
| data.fiatId | Integer | Included if the order has a fiat price |
| data.fiatSymbol | String | Included if the order has a fiat price |
| data.rate | String | If the order has a fiat price, CCPayment converts to coin amount at the current rate; included if the order has a fiat price. `amountToPay = price / rate` |
| data.createAt | Integer | Order creation timestamp, 10-digit |
| data.expiredAt | Integer | Order expiration time (10-digit seconds). Default validity 24 hours without timestamp; maximum validity 10 days. Rate locked before expiration; payments still received within 7 days after |
| data.checkoutUrl | String | Only returned when a checkout URL was created |
| data.buyerEmail | String | Email receiving order/payment info |
| data.paidList | Array | List of payments for this order. **Note**: if the coin used for a payment differs from the pre-determined payment coin, it will NOT be included in this list (e.g., pre-determined coin is ETH — a MATIC payment to this order is not listed) |
| data.paidList[index].recordId | String | CCPayment unique transaction ID |
| data.paidList[index].fromAddress | String | From address; not returned for UTXO-type transactions |
| data.paidList[index].amount | String | Received amount |
| data.paidList[index].serviceFee | String | Service fee |
| data.paidList[index].txid | String | TXID |
| data.paidList[index].status | String | `Success` / `Processing` / `Failed` |
| data.paidList[index].isFlaggedAsRisky | Boolean | Risky-transaction flag |
| data.paidList[index].arrivedAt | Integer | Deposit arrival timestamp |
| data.paidList[index].rate | String | Rate at time of receipt. If received before order expiration, remains the rate locked at order creation; if after, the rate at time of receipt. Paid fiat value = coin amount × rate. Included if the order has a fiat price |

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "amountToPay": "0.008552856654122477",
    "coinId": 1329,
    "coinSymbol": "MATIC",
    "chain": "POLYGON",
    "toAddress": "0x9abddce1ee18d1857c0653eb4a3fa9d9e0dcd584",
    "createAt": 1710233933,
    "rate": "1.1692",
    "fiatId": 1033,
    "fiatSymbol": "USD",
    "expiredAt": 1710243931,
    "checkoutUrl": "https://i.ccpayment.com/1djqz1m",
    "paidList": [
      {
        "recordId": "20240312090316119190942031876096",
        "fromAddress": "0x12438f04093ebc87f0ba629bbe93f2451711d967",
        "amount": "0.001",
        "serviceFee": "0.0000005",
        "txid": "0xef4abf7175cefbe2f06002a959892e4b407bef02175980eaa9bb1967fcba1b22",
        "status": "Success",
        "arrivedAt": 1710234197,
        "rate": "1.1692"
      }
    ]
  }
}
```

---

### 7.4 Deposit with Customer-Selected Currency and Network (Create Invoice / Hosted Checkout)

Creates a checkout page URL where the customer selects a currency from the "Tokens for your business" configured in your merchant account. Payments made in any configured currency are credited to the order. Merchants receive a webhook for every payment. This type of deposit is "API Deposit".

**POST** `https://ccpayment.com/ccpayment/v2/createInvoiceUrl`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | String | Yes | Order ID created by merchant. 3–64 characters |
| product | String | No | Product name displayed on the payment page. Less than 120 characters |
| returnUrl | String | No | URL the user is redirected to after completing payment. Must be a valid URL |
| closeUrl | String | No | URL the user is redirected to after clicking "leave page". Must be a valid URL |
| price | String | Yes | Product price — fiat amount or cryptocurrency amount |
| priceFiatId | String | No | ID of the fiat currency the price is denominated in (Get Fiat List) |
| priceCoinId | String | No | ID of the cryptocurrency the price is denominated in (Get Token List) |
| expiredAt | Integer | No | 10-digit timestamp; payment URL expires at this time. Default 24 hours |
| buyerEmail | String | No | Buyer's email for payment confirmation and transaction info |
| notifyUrl | String | No | Custom webhook URL for this request (domain must be whitelisted) |

**Rule**: pass **either** `priceFiatId` **or** `priceCoinId` as the denominating currency — do not pass both.

**Response**: `data.invoiceUrl` (String) — invoice payment URL; redirect the customer there.

```json
{ "code": 10000, "msg": "success", "data": { "invoiceUrl": "https://i.ccpayment.com/xxx" } }
```

**Webhook for Invoice API Deposit** — same `ApiDeposit` payload structure as 7.2 (note: one order ID may have multiple record IDs if there are multiple payments for one order). After receiving it, confirm via Get Order Information (customer-selected) (7.5).

---

### 7.5 Get Order Information (Customer-Selected Currency Deposit Order)

Retrieves invoice order information and all deposit records associated with the Order ID; use it to determine partially paid / overpaid / underpaid / overdue.

**POST** `https://ccpayment.com/ccpayment/v2/getInvoiceOrderInfo`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | String | Yes | 3–64 characters. Unique ID for the order |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.orderId | String | Order ID created by merchant |
| data.createAt | Integer | Order creation timestamp, 10-digit |
| data.product | String | Product name (included only if a valid value was provided) |
| data.price | String | Product price |
| data.priceFiatId | Integer | Included if the invoice is denominated in fiat |
| data.priceCoinId | String | Included if the invoice is denominated in cryptocurrency |
| data.priceSymbol | String | Symbol of the denominated currency (e.g., 'BTC', 'EUR') |
| data.invoiceUrl | String | Invoice payment URL |
| data.expiredAt | Integer | 10-digit expiration timestamp. Default 24 hours |
| data.totalPaidValue | String | Total amount paid for this order in the denominated currency |
| data.buyerEmail | String | Email receiving order/payment info |
| data.paidList | Array | List of payments associated with this order |
| data.paidList[index].recordId | String | CCPayment unique transaction ID |
| data.paidList[index].coinId | Integer | Payment coin ID |
| data.paidList[index].coinSymbol | String | Payment coin symbol |
| data.paidList[index].paidAmount | String | Paid coin amount |
| data.paidList[index].serviceFee | String | Service fee |
| data.paidList[index].rate | String | Rate at time of receipt = payment coin's USD value / denominated currency's USD value |
| data.paidList[index].paidValue | String | Paid amount in denominated currency: paidValue = paidAmount × rate |
| data.paidList[index].chain | String | Chain symbol |
| data.paidList[index].fromAddress | String | From address; not returned for UTXO type |
| data.paidList[index].toAddress | String | Receiving address for the selected coin. Payments up to 7 days past expiration are still credited and labeled overdue |
| data.paidList[index].toMemo | String | Memo for memo-required coins (XRP, XLM, TON, etc.) |
| data.paidList[index].txid | String | TXID |
| data.paidList[index].status | String | `Success` / `Processing` / `Failed` |
| data.paidList[index].isFlaggedAsRisky | Boolean | Risky-transaction flag |
| data.paidList[index].arrivedAt | String | Deposit arrival timestamp |

Example response shows multiple payments in different coins (USDT on BSC, CELO on CELO) each with their own rate and `paidValue`, summing to `totalPaidValue`.

---

### 7.6 Address Unbinding

Unbinds a deposit address from a userID/referenceID.

**Use case**: if a deposit address is flagged as risky, unbinding it helps prevent potential asset freezing by the network. Once unbound, obtain a new deposit address for the same userID/referenceID by calling Get Permanent Deposit Address (7.1) / Create or Get User Deposit Address (10.2).

**POST** `https://ccpayment.com/ccpayment/v2/addressUnbinding`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chain | String | Yes | Chain symbol of the address to be unbound |
| address | String | Yes | Address to be unbound |

**Rules**:
- If an address on an EVM-compatible blockchain (e.g., ETH, BSC, Polygon) is unbound, the corresponding deposit addresses on other EVM-compatible networks are also **automatically unbound**.
- After unbinding, payments sent to the unbound address can still be credited to your merchant account.

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.userID | String | Returned if the address was previously bound to a user ID |
| data.referenceID | String | Returned if the address was previously bound to a referenceID |
| data.unbound | Array | Unbound address details (chain + address) |
| data.unbound[index].chain | String | Network of the unbound address |
| data.unbound[index].address | String | Unbound address |
| data.unboundAt | Integer | Timestamp of the unbinding operation |

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "unbound": [ { "chain": "POLYGON", "address": "0xa9a363196b22c1760cc7B777C5dD6264C376F20a" } ],
    "unboundAt": 1741783734,
    "userID": "",
    "referenceID": "1735287108"
  }
}
```

---

### 7.7 Get Deposit Record

Retrieves detailed information for a specific record ID. **This is a crucial endpoint to get transaction details and confirm transaction status.** Use the returned information to update transaction status and credit your user accordingly.

**POST** `https://ccpayment.com/ccpayment/v2/getAppDepositRecord`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordId | String | Yes | CCPayment unique ID for a transaction |

**Response parameters** (`data.record.*`):

| Parameter | Type | Description |
|-----------|------|-------------|
| recordId | String | CCPayment unique transaction ID |
| coinId | Integer | Deposit coin ID |
| coinSymbol | String | Deposit coin symbol |
| chain | String | Chain symbol |
| contract | String | Contract |
| coinUSDPrice | String | Coin price in USD at the time of payment receipt |
| fromAddress | String | From address; **not returned for UTXO-type transactions** — the actual sender is among various input addresses; confirm with the payer to obtain the sender address |
| toAddress | String | Destination address |
| toMemo | String | Memo of the address |
| amount | String | Received amount |
| serviceFee | String | Service fee |
| txId | String | TXID |
| status | String | `Success` / `Processing` / `Failed` |
| isFlaggedAsRisky | Boolean | Risky-transaction flag (see 5.9) |
| arrivedAt | Integer | Deposit arrival timestamp |
| referenceId | String | Returned only if the payment has a linked reference ID |
| orderId | String | Returned only if the payment has a linked order ID |

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "record": {
      "recordId": "20250116073333231508600365121536",
      "orderId": "1737011983",
      "coinId": 1482,
      "coinSymbol": "TRX",
      "chain": "TRX",
      "contract": "TRX",
      "coinUSDPrice": "0.23717",
      "fromAddress": "TRPKg7eGMy9aZS2RumSPeWoyVkDqTVwLgL",
      "toAddress": "TAkmn3f8bgwMAwdVrGfUVSRg4W2XwqgHGc",
      "toMemo": "",
      "amount": "0.5",
      "serviceFee": "0.0025",
      "txId": "f39abf3275607fe2ffd40c06adf877f249829f6d1146a4f72ca2ad79ed7ed072",
      "status": "Success",
      "arrivedAt": 1737012813,
      "isFlaggedAsRisky": false
    }
  }
}
```

---

### 7.8 Get Deposit Record List

Gets a list of deposit records within a specific time range, sorted by creation time in descending order.

**POST** `https://ccpayment.com/ccpayment/v2/getAppDepositRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | No | Coin ID |
| referenceId | String | No | 3–64 characters. Unique reference ID for the user in your system |
| orderId | String | No | Order ID, 3–64 characters. **Do not pass both order ID and reference ID in the same request** |
| chain | String | No | Chain symbol |
| startAt | Integer | No | Retrieve records starting from this timestamp |
| endAt | Integer | No | Retrieve records up to this timestamp |
| nextId | String | No | Pagination cursor |

**Pagination**: if the query result exceeds 20 records, a `nextId` field is returned; use the same query conditions plus `nextId` to retrieve the remaining data.

**Response**: `data.records[]` — same fields per record as Get Deposit Record (7.7) — plus `data.nextId`.

---

## 8. Withdrawal APIs (Single & Batch)

### 8.1 Create Single Withdrawal Order (to Blockchain Address)

Creates a withdrawal order to a blockchain address.

Webhook behavior: if a withdrawal is processing, CCPayment sends a webhook with status `Processing`; when confirmed, a second webhook with status `Success`. In some cases on-chain processing is too fast to capture the processing state — only one webhook with status `Success` is sent.

**POST** `https://ccpayment.com/ccpayment/v2/applyAppWithdrawToNetwork`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | Yes | Coin ID |
| chain | String | Yes | Chain symbol |
| address | String | Yes | Withdrawal destination address |
| memo | String | No | Memo of the withdrawal address |
| orderId | String | Yes | Withdrawal order ID, 3–64 characters |
| amount | String | Yes | Withdrawal amount |
| merchantPayNetworkFee | Boolean | No | `true`: merchant pays network fee → net receivable = withdrawal amount. `false` (default): user pays network fee → net receivable = withdrawal amount − network fee |
| notifyUrl | String | No | Custom webhook URL for this request (domain must be whitelisted) |

**Response**: `data.recordId` (String).

```json
{ "code": 10000, "msg": "success", "data": { "recordId": "202403120909501767478092588126208" } }
```

**Reliability rule**: in the rare event of network jitter where you don't receive the response in time, reconfirm the withdrawal status via Get Withdrawal Record (8.3). If it indicates withdrawal success, the request was processed — do not resubmit blindly.

**Webhook for API Withdrawal** — payload includes both the order ID and record ID; use the record ID with Get Withdrawal Record to retrieve transfer info and update status / deduct from your user's account:

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | `ApiWithdrawal` |
| msg.recordId | String | CCPayment unique transaction ID |
| msg.orderId | String | Your unique order ID |
| msg.coinId | Integer | Coin ID |
| msg.coinSymbol | String | Coin symbol |
| msg.status | String | `WaitingApproval` (only if merchant enabled withdrawal approval) / `Rejected` (approval enabled) / `Processing` / `Success` / `Failed` |

Once a withdrawal is initiated, the blockchain confirms within a few minutes; however, due to rare external circumstances, merchants may sometimes fail to receive timely webhook notifications — poll Get Withdrawal Record as a fallback.

---

### 8.2 Withdrawal to Cwallet Account

Creates a withdrawal order to a Cwallet account.

**POST** `https://ccpayment.com/ccpayment/v2/applyAppWithdrawToCwallet`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | Yes | Coin ID |
| cwalletUser | String | Yes | Cwallet user — Cwallet ID or Email are both OK |
| amount | String | Yes | Withdrawal amount. Minimum limit is 0.001 USD |
| orderId | String | Yes | Order ID, 3–64 characters |

**Response**: `data.recordId` (String).

**CRITICAL**: For transactions transferred to a Cwallet account, **CCPayment does not send a webhook notification**. Reconfirm the withdrawal status via Get Withdrawal Record (8.3); if it indicates withdrawal success, the request was successfully processed.

---

### 8.3 Get Withdrawal Record

Retrieves one specific withdrawal's information.

**POST** `https://ccpayment.com/ccpayment/v2/getAppWithdrawRecord`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordId | String | No | CCPayment unique transaction ID |
| orderId | String | No | Order ID, 3–64 characters |

**Rule**: `recordId` and `orderId` cannot both be empty.

**Response parameters** (`data.record.*`):

| Parameter | Type | Description |
|-----------|------|-------------|
| recordId | String | CCPayment unique transaction ID |
| withdrawType | String | `Cwallet`: withdrawal to Cwallet user. `Network`: withdrawal to blockchain address |
| coinId | Integer | Coin ID |
| coinSymbol | String | Coin symbol |
| chain | String | Chain symbol |
| cwalletUser | String | Cwallet user ID — only returned for Cwallet withdrawals |
| fromAddress | String | From address; not returned for UTXO type or internal transfer to Cwallet |
| toAddress | String | Blockchain address — only returned for blockchain withdrawals |
| toMemo | String | Memo — only for blockchain withdrawals |
| txId | String | Blockchain transaction ID — only for blockchain withdrawals |
| status | String | `WaitingApproval` / `Rejected` / `Processing` / `Success` / `Failed` |
| orderId | String | Order ID |
| amount | String | Withdrawal amount |
| fee | Object | Network fee — only blockchain withdrawals incur a network fee |
| fee.coinId | String | Coin ID of the network fee coin |
| fee.coinSymbol | String | Coin symbol of the network fee coin |
| fee.amount | String | Amount of the network fee |

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "record": {
      "recordId": "202403120909501767478092588126208",
      "withdrawType": "Network",
      "coinId": 1891,
      "coinSymbol": "TETH",
      "chain": "POLYGON",
      "fromAddress": "0x1AE2828c18f9E3ae067F569aca1AE2828C4e7",
      "toAddress": "0xBb9C4e7F3687aca1AE2828c18f9E3ae067F569FE",
      "orderId": "1710234589577",
      "txId": "0xb55bb28292de56432b06204f71c68847a71670f2fc311af5c53a6ded45ab047b",
      "toMemo": "",
      "status": "Success",
      "amount": "0.004",
      "fee": { "coinId": 1891, "coinSymbol": "TETH", "amount": "0.001" }
    }
  }
}
```

---

### 8.4 Get Withdrawal Record List

**POST** `https://ccpayment.com/ccpayment/v2/getAppWithdrawRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | No | Coin ID |
| orderIds | Array[String] | No | Order IDs for the withdrawal, 3–64 chars each. Maximum 20 order IDs per query |
| chain | String | No | Chain symbol |
| startAt | Integer | No | Start timestamp |
| endAt | Integer | No | End timestamp |
| nextId | String | No | Pagination cursor |

**Response**: `data.records[]` — same fields per record as 8.3 — plus `data.nextId`. Pagination: 20 records per page via `nextId`.

---

### 8.5 Batch Withdrawal APIs

Merchant-level bulk disbursement from the merchant master balance (see Section 6.4 for the full workflow and applicability). **Not available for wallet-mode user balances.**

#### 8.5.1 Validate Batch Withdrawal Addresses

Validates the format of withdrawal addresses and memos in batch, and checks whether any address hits the blacklist. **Calling this endpoint is optional** (but strongly recommended before initiating a batch).

**POST** `https://ccpayment.com/ccpayment/v2/checkWithdrawAddress`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chain | String | Yes | Blockchain network abbreviation, e.g. `XRP`, `ETH` |
| addressInfoList | Array | Yes | List of address information to validate |
| addressInfoList.seq | Integer | Yes | Sequence number identifying a specific address entry |
| addressInfoList.address | String | Yes | Payout address |
| addressInfoList.memo | String | No | Memo |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data | Object | **No content returned if all addresses are valid** |
| data.addressInfoResults | Array | List of validation results |
| data.addressInfoResults.seq | Integer | Corresponding request sequence number |
| data.addressInfoResults.codes | Array[Int] | Array of error codes (empty array = the address is valid). Error codes: `14007` WithdrawAddrFormat (invalid address format), `14025` AddressMemoFormatErr (memo cannot be empty for this chain), `14027` SeqDuplicate (duplicate sequence number), `14029` AddressBlackList (blacklisted address) |

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "addressInfoResults": [
      { "seq": 1, "codes": [] },
      { "seq": 2, "codes": [14007] }
    ]
  }
}
```

#### 8.5.2 Initiate Batch Withdrawal

Submits a batch withdrawal request and generates a batch withdrawal master order. The initial call can create up to **50 sub-orders**; if more are needed, call Append Sub-orders (max 100 per call). A single master order can contain up to **500 sub-orders** total. Once created, if the merchant does not confirm the withdrawal within **30 minutes**, the order automatically expires.

**POST** `https://ccpayment.com/ccpayment/v2/applyBatchWithdraw`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| batchOrderId | String | Yes | Merchant-defined batch withdrawal order ID, unique per merchant. 3–64 characters |
| coinId | Integer | Yes | Coin ID |
| chain | String | Yes | Blockchain network abbreviation |
| taskName | String | No | Batch withdrawal name |
| mode | String | Yes | Execution mode. `Single`: sequential — sub-orders are executed and submitted on-chain one by one; pending sub-orders can be canceled during processing; slower. `Batch`: bundled — all sub-orders are packed and submitted on-chain together; individual sub-order cancellation not supported during processing; faster |
| orders | Array | No | List of sub-orders, maximum 50 |
| orders.orderId | String | No | Sub-order ID, unique across all records for the same merchant. 3–64 characters. Required when submitting orders |
| orders.address | String | No | Withdrawal address. Required when submitting orders |
| orders.memo | String | No | Memo |
| orders.amount | String | No | Withdrawal amount. Required when submitting orders |
| orders.remark | String | No | Remark |
| notifyUrl | String | No | Custom webhook URL for this request (domain must be whitelisted) |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.billId | String | Batch withdrawal bill ID — the unique identifier on the CCPayment platform |
| data.batchOrderId | String | Batch withdrawal master order ID |

#### 8.5.3 Append Sub-orders

Appends sub-orders to a master order that has been created but **not yet confirmed**. Max 100 sub-orders per call; hard cap 500 per master order — any append request exceeding this limit fails. The platform validates address format and blacklist status of **all** sub-orders in the append request; if any sub-order fails validation, **the entire append request fails — no partial success**. This endpoint is optional.

**POST** `https://ccpayment.com/ccpayment/v2/appendBatchWithdraw`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| batchOrderId | String | Yes | Merchant batch withdrawal order ID |
| orders | Array | Yes | List of sub-orders to append. Maximum 100 per call |
| orders.orderId | String | Yes | Sub-order ID, unique per merchant. 3–64 characters |
| orders.address | String | Yes | Payout address |
| orders.memo | String | No | Memo |
| orders.amount | String | Yes | Withdrawal amount |
| orders.remark | String | No | Remark |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.batchOrderId | String | Merchant batch withdrawal order ID |
| data.appended | Integer | Number of sub-orders successfully appended in this request (all-or-nothing) |
| data.total | Integer | Total number of sub-orders under the current master order |

```json
{ "code": 10000, "msg": "success", "data": { "batchOrderId": "xxxxx", "appended": 2, "total": 52 } }
```

#### 8.5.4 Confirm Batch Withdrawal

Confirms or cancels a batch withdrawal task. Once confirmed, the order stops accepting new sub-orders and enters the approval or withdrawal process.

**POST** `https://ccpayment.com/ccpayment/v2/confirmBatchWithdraw`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| batchOrderId | String | Yes | Merchant batch withdrawal order ID |
| confirmExecution | Boolean | Yes | `true`: confirm — stop appending sub-orders and proceed with the withdrawal. `false`: cancel this batch withdrawal (only valid while the order is still in `Init` status) |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.batchOrderId | String | Merchant batch withdrawal order ID |
| data.taskName | String | Name of this batch withdrawal |
| data.billId | String | Batch withdrawal bill ID (CCPayment platform unique identifier) |
| data.amount | String | Total amount |
| data.networkFee | String | Total network fee |
| data.coin | Object | Payout coin |
| data.coin.coinId | Integer | Payout coin ID |
| data.coin.coinPrice | String | Unit price of the payout coin (total value must be calculated by the merchant) |
| data.coin.coinSymbol | String | Payout token symbol |
| data.networkFeeCoin | Object | Network fee coin (coinId / coinPrice / coinSymbol, same semantics) |
| data.status | String | Master order status — see status table below |
| data.mode | String | `Single` / `Batch` (see 8.5.2) |
| data.reason | String | Failure/rejection reason |
| data.stats | Object | Statistics: `total`, `succeeded`, `failed`, `canceled`, `processing` (Integer counts of sub-orders) |
| data.createdAt | Integer | Creation timestamp (seconds) |
| data.updatedAt | Integer | Last updated timestamp (seconds) |

**Master order status values**:

| Status | Meaning |
|--------|---------|
| `Init` | Initialized, awaiting withdrawal confirmation |
| `WaitingApproval` | Under review. The withdrawal amount has been frozen |
| `Rejected` | Review rejected. The frozen amount has been released |
| `Pending` | Awaiting execution (approved or no approval required); execution time not yet reached. The withdrawal amount has been frozen |
| `Processing` | Processing |
| `Completed` | Entire order completed |
| `Canceled` | Entire order canceled. If previously confirmed then canceled, the frozen amount is released; if not yet confirmed, no amount was frozen |

#### 8.5.5 Terminate Batch Withdrawal

Terminates or cancels a batch withdrawal operation.

- Mode `Batch`: effective only when the master order status is `WaitingApproval` or `Pending`.
- Mode `Single`: effective when the master order status is `WaitingApproval`, `Pending`, or `Processing`.

**POST** `https://ccpayment.com/ccpayment/v2/abortBatchWithdraw`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| batchOrderId | String | Yes | Merchant batch withdrawal order ID |
| orderIds | Array[String] | No | Set of sub-order IDs to terminate. **Only applicable when mode is `Single`.** If not provided, all remaining unexecuted sub-orders are terminated by default |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.batchOrderId | String | Merchant batch withdrawal order ID |
| data.status | String | Master order status |
| data.canceledOrderIds | Array[String] | Sub-order IDs successfully canceled in this request |

#### 8.5.6 Query Master Order Details

Retrieves batch order details by `batchOrderId`; the `verbose` parameter controls the response field scope.

**POST** `https://ccpayment.com/ccpayment/v2/getBatchWithdrawOrder`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| batchOrderId | String | Yes | Merchant batch withdrawal order ID |
| verbose | Integer | Yes | Response field level: `0`: batchOrderId, taskName, billId, status, reason. `1`: + stats, mode. `2`: + coin, amount, networkFee, networkFeeCoin. `3`: all fields |

**Response**: same field set as Confirm Batch Withdrawal (8.5.4), filtered by verbose level.

#### 8.5.7 Query Sub-order Records

Paginated retrieval of all sub-order records under a batch withdrawal master order.

**POST** `https://ccpayment.com/ccpayment/v2/getBatchWithdrawOrderRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| batchOrderId | String | Yes | Merchant batch withdrawal order ID |
| nextId | String | No | Next page ID |
| limit | Integer | No | Records per page. Default 20, maximum 500 |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.nextId | String | ID for the next page (cursor pagination) |
| data.records | Array | List of sub-order records |
| data.records.orderId | String | Merchant sub-order ID |
| data.records.recordId | String | Sub-order transaction record ID — unique record ID generated by CCPayment per transaction. **Only generated when the sub-order status is Processing** |
| data.records.address | String | Recipient address |
| data.records.memo | String | Memo |
| data.records.amount | String | Withdrawal amount |
| data.records.networkFee | String | Network fee |
| data.records.status | String | Sub-order status: `Successful`, `Failed`, `Pending`, `Processing`, `Canceled` |
| data.records.txId | String | On-chain transaction hash |
| data.records.remark | String | Sub-order remark |
| data.records.reason | String | Failure reason |
| data.records.createdAt | Integer | Creation timestamp (seconds) |
| data.records.updatedAt | Integer | Last updated timestamp (seconds) |

#### 8.5.8 Webhook for ApiBatchWithdrawal

CCPayment sends a webhook upon **any status change of the master order or a sub-order**. After receiving the notification, use `batchOrderId` to query the master order and `orderId` to query the sub-order.

**Master order webhook payload**:

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | Always `ApiBatchWithdrawal` |
| msg.batchOrderId | String | Merchant batch withdrawal order ID |
| msg.coinId | Integer | Coin ID |
| msg.coinSymbol | String | Coin symbol |
| msg.status | String | Latest master order status (e.g., `Rejected`, `Completed`, `Approved`) |

**Sub-order webhook payload**:

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | Always `ApiBatchWithdrawal` |
| msg.orderId | String | Merchant sub-order ID |
| msg.recordId | String | Sub-order transaction record ID (only generated once the sub-order is Processing) |
| msg.coinId | Integer | Coin ID |
| msg.coinSymbol | String | Coin symbol |
| msg.status | String | Latest sub-order status (e.g., `Success`, `Failed`) |

---

## 9. Swap APIs

Merchant-level swaps operate on the merchant balance. (User-level swaps — Section 10.5 — use the same `estimate` endpoint plus `userSwap`.)

### 9.1 Get Swap Quote

Retrieves the estimated amount of the target coin that will be received for a given amount of the input coin.

**POST** `https://ccpayment.com/ccpayment/v2/estimate`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinIdIn | Integer | Yes | ID of the input coin |
| amountIn | String | Yes | Amount of input coin |
| coinIdOut | Integer | Yes | ID of the output coin |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.coinIdIn | Integer | ID of the input coin |
| data.coinIdOut | Integer | ID of the output coin |
| data.amountOut | String | Amount of the output coin |
| data.netAmountOut | String | Net receivable output amount. `netAmountOut = amountOut - fee` |
| data.amountIn | String | Amount of the input coin |
| data.feeRate | String | CCPayment service fee rate for the swap |
| data.fee | String | Fee amount = feeRate × amountOut. **If the calculated swap service fee is lower than 0.1 USDT, a minimum fee equivalent to 0.1 USDT in the output coin is applied instead** |
| data.swapRate | String | swapRate = amountIn / amountOut |

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "coinIdIn": 1280,
    "coinIdOut": 1329,
    "amountOut": "194.09158706508187",
    "amountIn": "100",
    "swapRate": "1.9409158706508187",
    "feeRate": "0.005",
    "fee": "0.97045793532540935",
    "netAmountOut": "193.12112912975646065"
  }
}
```

### 9.2 Create and Fulfill Swap Order

Creates a swap order and exchanges one cryptocurrency for another. Returns the swap transaction details, including the calculated output amount, swap rate, and service fee.

**POST** `https://ccpayment.com/ccpayment/v2/swap`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | String | Yes | Swap order ID created by merchant, 3–64 characters |
| coinIdIn | Integer | Yes | ID of the input coin |
| amountIn | String | Yes | Amount of the input coin |
| coinIdOut | Integer | Yes | ID of the output coin |
| amountOutMinimum | String | No | Minimum output amount the user is willing to receive. If the swap results in less, the transaction is not executed. **Slippage protection against unfavorable exchange rates** |

**Response parameters**: `data.recordId`, `data.orderId`, `data.coinIdIn`, `data.coinIdOut`, `data.amountOut`, `data.netAmountOut` (= amountOut − fee), `data.amountIn`, `data.feeRate`, `data.fee` (min 0.1 USDT equivalent), `data.swapRate` (= amountIn/amountOut).

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "recordId": "20240719085639165937311982694400",
    "orderId": "1721379398507",
    "coinIdIn": 1280,
    "coinIdOut": 1329,
    "amountOut": "1.9428459962937677",
    "amountIn": "1",
    "swapRate": "1.9428459962937677",
    "fee": "0.1950648590656393",
    "feeRate": "0.1004016064257028",
    "netAmountOut": "1.7477811372281284"
  }
}
```

### 9.3 Get Swap Record

Retrieves the details of a specific swap order.

**POST** `https://ccpayment.com/ccpayment/v2/getSwapRecord`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordId | String | No | CCPayment unique transaction ID |
| orderId | String | No | Swap order ID created by merchant, 3–64 characters |

**Rule**: pass either `orderId` or `recordId` — don't pass both or pass nothing.

**Response parameters** (`data.record.*`): `recordId`, `orderId`, `coinInSymbol`, `coinIdIn`, `coinOutSymbol`, `coinIdOut`, `amountOut`, `netAmountOut` (= amountOut − fee), `amountIn`, `userId` (String, 5–64 chars, cannot start with 'sys'), `swapRate` (= amountIn/amountOut), `feeRate`, `fee` (min 0.1 USDT equivalent), `status` (`Success` / `Processing` / `Failed`), `createdAt` (10-digit order creation timestamp), `arrivedAt` (payment arrived timestamp), `amountOutMinimum`.

### 9.4 Get Swap Record List

**POST** `https://ccpayment.com/ccpayment/v2/getSwapRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordIds | Array[String] | No | CCPayment transaction IDs |
| orderIds | Array[String] | No | Merchant swap order IDs, 3–64 characters |
| coinIdIn | Integer | No | Input coin ID |
| coinIdOut | Integer | No | Output coin ID |
| startAt | Integer | No | Start timestamp, 10-digit |
| endAt | Integer | No | End timestamp, 10-digit |
| nextId | String | No | Pagination cursor |

**Rule**: the longest available time period is **three months** — `endAt` should not be more than three months after `startAt`.

**Response**: `data.records[]` (same fields as 9.3) + `data.nextId` (returned when results exceed 20 records).

---

## 10. Create a Wallet System (User-Level APIs)

If you want to establish a wallet system and allow users to have independent accounts, use the wallet system APIs. CCPayment provides a user asset management list on the merchant dashboard.

**User ID rules (apply to ALL user-level APIs)**:
- `userId` should be a string of **5–64 characters** and **cannot start with "sys"**.
- The user ID for merchant accounts is the **APP ID**. Do not assign the APP ID to your users. (To transfer user funds to your merchant account via internal transfer, use the APP ID as the `toUserId`.)

### 10.1 User Balance

#### 10.1.1 Get User Balance List

**POST** `https://ccpayment.com/ccpayment/v2/getUserCoinAssetList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | User ID (5–64 chars, not starting with "sys") |

**Response**: `data.userId` + `data.assets[]` with `coinId` (Integer), `coinSymbol` (String), `available` (String — available amount).

#### 10.1.2 Get Coin Balance of Users

**POST** `https://ccpayment.com/ccpayment/v2/getUserCoinAsset`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | User ID |
| coinId | Integer | Yes | Coin ID |

**Response**: `data.userId` + `data.asset` object with `coinId`, `coinSymbol`, `available`.

```json
{ "code": 10000, "msg": "success", "data": { "userId": "6322718677975328", "asset": { "coinId": 1280, "coinSymbol": "USDT", "available": "0.020996" } } }
```

### 10.2 User Deposit API

#### 10.2.1 Create or Get User Deposit Address

Creates or gets the permanent deposit address of the user. The merchant receives a webhook for every payment made to this address. This type of deposit is "User Deposit". Each APP ID can obtain **1000 user addresses** via this interface; contact customer service for more.

**POST** `https://ccpayment.com/ccpayment/v2/getOrCreateUserDepositAddress`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | User ID (5–64 chars, not starting with "sys"; never the APP ID) |
| chain | String | Yes | Chain symbol |
| notifyUrl | String | No | Custom webhook URL for this request (domain must be whitelisted) |

**Response**: `data.address` (permanent deposit address for the user), `data.memo` (for memo-required coins such as XRP, XLM — the user must fill in the correct memo).

**Webhook for User Deposit** — after receiving it, call Get User Deposit Record (10.2.2) to confirm:

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | `UserDeposit` |
| msg.recordId | String | CCPayment unique transaction ID |
| msg.userId | String | User ID |
| msg.coinId | Integer | Coin ID |
| msg.coinSymbol | String | Coin symbol |
| msg.amount | String | Amount (present in webhook example) |
| msg.status | String | `Processing` / `Success` / `Failed` |
| msg.isFlaggedAsRisky | Boolean | Risky-transaction flag (see 5.9) |

#### 10.2.2 Get User Deposit Record

Retrieves detailed information for a specific record ID — crucial for confirming transaction status before crediting your user.

**POST** `https://ccpayment.com/ccpayment/v2/getUserDepositRecord`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordId | String | Yes | CCPayment unique transaction ID |

**Response** (`data.record.*`): `userId`, `recordId`, `coinId`, `coinSymbol`, `chain`, `contract`, `coinUSDPrice`, `fromAddress` (not returned for UTXO type — confirm with the payer to obtain the sender address), `toAddress`, `toMemo`, `amount`, `serviceFee`, `txId`, `status` (`Success` / `Processing` / `Failed`), `isFlaggedAsRisky`, `arrivedAt`.

#### 10.2.3 Get User Deposit Record List

Deposit records sorted by creation time descending.

**POST** `https://ccpayment.com/ccpayment/v2/getUserDepositRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | No | Coin ID |
| userId | String | Yes | User ID |
| chain | String | No | Chain symbol |
| startAt | Integer | No | Start timestamp |
| endAt | Integer | No | End timestamp |
| nextId | String | No | Pagination cursor |

**Response**: `data.records[]` (same fields as 10.2.2) + `data.nextId` (returned when results exceed 20 records).

### 10.3 User Withdrawal API

#### 10.3.1 Withdrawal to Blockchain Address

Creates a user withdrawal order to a blockchain address. Webhook behavior: `Processing` webhook first, then `Success`; if on-chain processing is too fast, only one `Success` webhook is sent.

**POST** `https://ccpayment.com/ccpayment/v2/applyUserWithdrawToNetwork`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | User ID |
| coinId | String | Yes | Coin ID |
| chain | String | Yes | Chain symbol |
| address | String | Yes | Withdrawal destination address |
| memo | String | No | Memo of the address |
| orderId | String | Yes | Withdrawal order ID, 3–64 characters |
| amount | String | Yes | Withdrawal amount |
| notifyUrl | String | No | Custom webhook URL for this request (domain must be whitelisted) |

**Response**: `data.recordId` (String).

**Webhook for User Withdrawal** — use the record ID with Get User Withdrawal Record (10.3.3) to retrieve transfer info, update status, or deduct from your user's account:

| Parameter | Type | Description |
|-----------|------|-------------|
| type | String | `UserWithdrawal` |
| msg.recordId | String | CCPayment unique transaction ID |
| msg.orderId | String | Order ID |
| msg.userId | String | User ID |
| msg.coinId | Integer | Coin ID |
| msg.coinSymbol | String | Coin symbol |
| msg.status | String | `Processing` / `Success` / `Failed` / `WaitingApproval` (approval enabled only) / `Rejected` |

**Reliability rule**: if a withdrawal was initiated **2 hours** ago and you still have not received a `Success` webhook, call Get User Withdrawal Record to retrieve and confirm the transaction.

#### 10.3.2 Withdrawal to Cwallet Account

**POST** `https://ccpayment.com/ccpayment/v2/applyUserWithdrawToCwallet`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| userId | String | Yes | User ID |
| coinId | String | Yes | Coin ID |
| cwalletUser | String | Yes | Cwallet user — Cwallet ID or Email are both OK |
| amount | String | Yes | Withdrawal amount. Minimum limit is 0.001 USD |
| orderId | String | Yes | Order ID, 3–64 characters |

**Response**: `data.recordId`.

**CRITICAL**: No webhook is sent for Cwallet transfers. Reconfirm the withdrawal status via Get User Withdrawal Record.

#### 10.3.3 Get User Withdrawal Record

**POST** `https://ccpayment.com/ccpayment/v2/getUserWithdrawRecord`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordId | String | No | CCPayment unique transaction ID |
| orderId | String | No | Withdrawal order ID, 3–64 characters |

**Rule**: `recordId` and `orderId` cannot both be empty.

**Response** (`data.record.*`): `userId`, `recordId`, `withdrawType` (`Cwallet` / `Network`), `coinId`, `coinSymbol`, `chain`, `cwalletUser` (Cwallet withdrawals only), `fromAddress` (not returned for UTXO type or internal transfer to Cwallet), `toAddress` / `toMemo` / `txId` (blockchain withdrawals only), `status` (`Processing` / `Success` / `Failed` / `WaitingApproval` / `Rejected`), `orderId`, `amount`, `fee` object (`coinId`, `coinSymbol`, `amount` — only blockchain withdrawals incur a network fee).

#### 10.3.4 Get User Withdrawal Record List

**POST** `https://ccpayment.com/ccpayment/v2/getUserWithdrawRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | No | Coin ID |
| toAddress | String | No | Destination address |
| userId | String | Yes | User ID |
| chain | String | No | Chain symbol |
| startAt | Integer | No | Start timestamp |
| endAt | Integer | No | End timestamp |
| nextId | String | No | Pagination cursor |

**Response**: `data.records[]` (same fields as 10.3.3) + `data.nextId` (returned when results exceed 20 records).

### 10.4 User Internal Transaction API

#### 10.4.1 Create an Internal Transaction

Creates an internal transaction between users (tipping, marketplace payouts, sweeping funds to the merchant account, etc.).

**POST** `https://ccpayment.com/ccpayment/v2/userTransfer`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| fromUserId | String | Yes | From User ID (5–64 chars, not starting with "sys") |
| toUserId | String | Yes | To User ID (5–64 chars, not starting with "sys"). **To transfer user funds to your merchant account, use the APP ID as the User ID** |
| coinId | Integer | Yes | Coin ID |
| amount | String | Yes | Amount. Minimum limit is 0.001 USD |
| orderId | String | Yes | Order ID, 3–64 characters |
| remark | String | No | Transaction note, within 255 characters |

**Response**: `data.recordId`.

**Rules**: For internal transactions **no webhook is sent**. When the returned status is "success" (`code: 10000`), the transaction is successful and merchants can credit the user accordingly.

#### 10.4.2 Get User Internal Transaction Record

**POST** `https://ccpayment.com/ccpayment/v2/getUserTransferRecord`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordId | String | No | CCPayment unique transaction ID |
| orderId | String | No | Order ID, 3–64 characters |

**Rule**: `recordId` and `orderId` cannot both be empty.

**Response** (`data.record.*`): `recordId`, `coinId`, `coinSymbol`, `orderId`, `fromUserId`, `toUserId`, `amount`, `status` (`Success` / `Failed`), `remark`.

#### 10.4.3 Get User Internal Transaction Record List

**POST** `https://ccpayment.com/ccpayment/v2/getUserTransferRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | No | Coin ID |
| fromUserId | String | Yes | From User ID |
| toUserId | String | Yes | To User ID (APP ID = merchant account) |
| startAt | Integer | No | Start timestamp |
| endAt | Integer | No | End timestamp |
| nextId | String | No | Pagination cursor |

**Response**: `data.records[]` (fields as 10.4.2) + `data.nextId` (returned when results exceed 20 records).

### 10.5 User Swap API

#### 10.5.1 User Get Swap Quote

Same endpoint as the merchant swap quote, plus the `extraFeeRate` parameter.

**POST** `https://ccpayment.com/ccpayment/v2/estimate`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinIdIn | Integer | Yes | ID of the input coin |
| amountIn | String | Yes | Amount of input coin |
| coinIdOut | Integer | Yes | ID of the output coin |
| extraFeeRate | String | No | Percentage rate you want to charge for this transaction as **your** service fee. **Only available with the user swap interface.** Example: `0.01` = 1% service fee |

**Response parameters**: as merchant quote (9.1) plus `data.extraFee` (String — extraFeeRate × output coin amount). Note: for user swaps, `netAmountOut = amountOut - fee - extraFee`.

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "coinIdIn": 1280,
    "coinIdOut": 1482,
    "amountOut": "3.6790100655646874",
    "amountIn": "1",
    "swapRate": "3.6790100655646874",
    "feeRate": "0.1004016064257028",
    "fee": "0.3693785206390248",
    "extraFee": "0.036790100655646874",
    "netAmountOut": "3.272841444270015726"
  }
}
```

#### 10.5.2 Create and Fulfill User Swap Order

**POST** `https://ccpayment.com/ccpayment/v2/userSwap`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| orderId | String | Yes | 3–64 characters. Unique order ID in your system |
| userId | String | Yes | User ID (5–64 chars, not starting with 'sys') |
| coinIdIn | Integer | Yes | ID of the input coin |
| amountIn | String | Yes | Amount of the input coin |
| coinIdOut | Integer | Yes | ID of the output coin |
| extraFeeRate | String | No | Your service-fee markup rate (e.g., `0.01` = 1%) |
| amountOutMinimum | String | No | Slippage protection — the swap is not executed if the output would be less than this |

**Response parameters**: `data.recordId`, `data.orderId`, `data.coinIdIn`, `data.coinIdOut`, `data.amountOut` (= amountIn × swapRate), `data.netAmountOut` (= amountOut − fee − extraFee), `data.amountIn`, `data.feeRate`, `data.fee` (min 0.1 USDT equivalent), `data.swapRate` (= amountIn/amountOut), `data.extraFee`.

#### 10.5.3 Get User Swap Record

**POST** `https://ccpayment.com/ccpayment/v2/getUserSwapRecord`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordId | String | No | CCPayment unique transaction ID |
| orderId | String | No | Swap order ID created by merchant, 3–64 characters |

**Rule**: pass either `orderId` or `recordId` — don't pass both or pass nothing.

**Response** (`data.record.*`): all fields of the merchant swap record (9.3) — `recordId`, `orderId`, `coinInSymbol`, `coinIdIn`, `coinOutSymbol`, `coinIdOut`, `amountOut`, `netAmountOut` (= amountOut − fee − extraFee), `amountIn`, `userId`, `swapRate`, `feeRate`, `fee`, `status`, `createdAt`, `arrivedAt`, `amountOutMinimum` — plus `extraFee` and `extraFeeRate`.

#### 10.5.4 Get User Swap Record List

**POST** `https://ccpayment.com/ccpayment/v2/getUserSwapRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| recordIds | Array[String] | No | CCPayment transaction IDs |
| orderIds | Array[String] | No | Merchant swap order IDs |
| userId | String | No | User ID |
| coinIdIn | Integer | No | Input coin ID |
| coinIdOut | Integer | No | Output coin ID |
| startAt | Integer | No | Start timestamp, 10-digit |
| endAt | Integer | No | End timestamp, 10-digit |
| nextId | String | No | Pagination cursor |

You can query under a single condition or multiple conditions.

**Response**: `data.records[]` (same fields as 10.5.3) + `data.nextId` (returned when results exceed 20 records).

---

## 11. Common APIs

### 11.1 Get Token List

Retrieves all details of tokens you've enabled for your business ("Tokens for your business").

**POST** `https://ccpayment.com/ccpayment/v2/getCoinList` — no parameters required.

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.coins | Array | Token list |
| data.coins[index].coinId | Integer | Coin ID — use this in deposit/withdrawal/swap APIs |
| data.coins[index].symbol | String | Coin symbol |
| data.coins[index].coinFullName | String | Coin full name |
| data.coins[index].logoUrl | String | Coin logo |
| data.coins[index].status | String | Coin status: `Normal`: available deposit/withdrawal. `Maintain`: withdrawal suspended. `Pre-delisting`: deposit suspended. `Delisted`: deposit/withdrawal suspended |
| data.coins[index].networks | Object | Supported networks for this coin, keyed by chain symbol (e.g., `BSC`, `ETH`, `AVAX`) |
| data.coins[index].networks[chain].chain | String | Chain symbol — use this in the `chain` parameter of APIs |
| data.coins[index].networks[chain].chainFullName | String | Full name of the chain |
| data.coins[index].networks[chain].contract | String | Coin contract |
| data.coins[index].networks[chain].precision | Integer | Precision |
| data.coins[index].networks[chain].canDeposit | Boolean | Deposit status |
| data.coins[index].networks[chain].canWithdraw | Boolean | Withdrawal status |
| data.coins[index].networks[chain].minimumDepositAmount | String | Minimal deposit amount |
| data.coins[index].networks[chain].minimumWithdrawAmount | String | Minimal withdrawal amount |
| data.coins[index].networks[chain].maximumWithdrawAmount | String | Maximum withdrawal amount. `0` = no maximum for this coin |
| data.coins[index].networks[chain].isSupportMemo | Boolean | Whether transactions on this chain require a memo |

### 11.2 Get Token Information

Retrieves detailed information of one specific token.

**POST** `https://ccpayment.com/ccpayment/v2/getCoin`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | Yes | Coin ID |

**Response**: `data.coin` — same structure as a single coin object in Get Token List (11.1).

### 11.3 Get Token Price

**POST** `https://ccpayment.com/ccpayment/v2/getCoinUSDTPrice`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinIds | Array | Yes | Array of coin IDs |

**Response**: `data.prices` — an object keyed by coinId; each value (String) is the equivalent USDT value of the coin.

```json
{ "code": 10000, "msg": "success", "data": { "prices": { "1329": "1.1683" } } }
```

### 11.4 Get Balance List (Merchant)

Retrieves all balances in the merchant account.

**POST** `https://ccpayment.com/ccpayment/v2/getAppCoinAssetList` — no parameters required.

**Response**: `data.assets[]` with `coinId` (Integer), `coinSymbol` (String), `available` (String).

### 11.5 Get Coin Balance (Merchant)

Retrieves the balance of one provided coin.

**POST** `https://ccpayment.com/ccpayment/v2/getAppCoinAsset`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | Yes | Coin ID |

**Response**: `data.asset` with `coinId`, `coinSymbol`, `available`.

### 11.6 Rescan Lost Transaction

Triggers a rescan for a deposit transaction. **Use case**: a user confirms the on-chain transaction was successful but the funds haven't been credited — call this endpoint (prompting the user to submit the transaction details); the system rescans the transaction to speed up crediting.

**POST** `https://ccpayment.com/ccpayment/v2/rescanLostTransaction`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chain | String | Yes | Chain symbol. Get chain info by calling Get Chain List |
| toAddress | String | Yes | Receiving address of the deposit |
| memo | String | No | Memo for memo-required coins (XRP, XLM, TON, etc.) |
| txId | String | Yes | TXID |

**Response**: `data.description` (String) — detailed message returned by the system; you can display it to the user to indicate the current deposit processing status.

```json
{ "code": 10000, "msg": "success", "data": { "description": "The deposit has been rescanned. Please wait for the transaction to be credited." } }
```

### 11.7 Get Cwallet User Information

Pass a Cwallet ID to check if it belongs to a Cwallet user and retrieve its username. Use before Cwallet withdrawals.

**POST** `https://ccpayment.com/ccpayment/v2/getCwalletUserId`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| cwalletUserId | String | Yes | Cwallet user ID |

**Response**: `data.cwalletUserId`, `data.cwalletUserName`.

```json
{ "code": 10000, "msg": "success", "data": { "cwalletUserId": "35255142", "cwalletUserName": "j***@proton.me" } }
```

### 11.8 Check Withdrawal Address Validity

Verifies if a withdrawal address is eligible to receive the transfer.

**POST** `https://ccpayment.com/ccpayment/v2/checkWithdrawalAddressValidity`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chain | String | Yes | Symbol of the network (e.g., `AVAX` for Avalanche) |
| address | String | Yes | Receiving address of the withdrawal |

**Response**: `data.addrIsValid` (Boolean) — `true`: valid address; `false`: invalid address.

### 11.9 Get Withdrawal Network Fee

Retrieves the withdrawal network fee for a given token.

**POST** `https://ccpayment.com/ccpayment/v2/getWithdrawFee`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | Yes | Coin ID |
| chain | String | Yes | Chain symbol |

**Response**: `data.fee` object — `coinId` (Integer, coin ID of the network fee), `coinSymbol` (String), `amount` (String).

```json
{ "code": 10000, "msg": "success", "data": { "fee": { "coinId": 1329, "coinSymbol": "MATIC", "amount": "0.0213814" } } }
```

### 11.10 Get Fiat List

Retrieves the list of fiat information (for pricing orders in fiat).

**POST** `https://ccpayment.com/ccpayment/v2/getFiatList` — no parameters required.

**Response**: `data.fiats[]` with `fiatId` (Integer), `symbol` (String), `logoUrl` (String), `mark` (String — fiat icon), `usdRate` (String — equivalent fiat value of 1 USD).

```json
{
  "code": 10000,
  "msg": "success",
  "data": { "fiats": [ { "fiatId": 1022, "symbol": "DKK", "logoUrl": "https://resource.ccpayment.com/fiat/DKK.png", "mark": "KR", "usdRate": "6.825765" } ] }
}
```

### 11.11 Get Swap Coin List

Retrieves the list of all coins available for swap.

**POST** `https://ccpayment.com/ccpayment/v2/getSwapCoinList` — no parameters required.

**Response**: `data.coins[]` with `coinId` (Integer), `symbol` (String), `logoUrl` (String).

**Note**: add swappable coins to the "Tokens for your business" list to get all swappable coin info returned.

### 11.12 Get Chain List

Retrieves the current network statuses for all supported chains. Pass chain symbols to check specific network statuses.

**POST** `https://ccpayment.com/ccpayment/v2/getChainList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| chains | Array | No | Chain symbols. Example: `"chains": ["BSC"]` |

**Response parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| data.chains[index].chain | String | Chain symbol (e.g., `BSC`) |
| data.chains[index].chainFullName | String | Full name of the chain |
| data.chains[index].explorer | String | Blockchain explorer URL |
| data.chains[index].baseUrl | String | Prefix of the on-chain transaction query URL. **Usage: append/substitute the txId into the base URL to construct a full transaction query URL** (the URL contains a `%s` placeholder, e.g., `https://etherscan.io/tx/%s`) |
| data.chains[index].confirmations | Integer | Required block confirmations |
| data.chains[index].isEVM | Boolean | `true`: EVM-compatible chain |
| data.chains[index].supportMemo | Boolean | `true`: memo/tag is required when using addresses on this chain |
| data.chains[index].logoUrl | String | Chain logo |
| data.chains[index].status | String | `Normal`: deposits and withdrawals operating normally. `Maintenance`: deposits/withdrawals may experience delays, or transactions on this network cannot be processed at this moment |

```json
{
  "code": 10000,
  "msg": "success",
  "data": {
    "chains": [
      { "chain": "ETH", "chainFullName": "Ethereum", "explorer": "https://etherscan.io/", "logoUrl": "https://resource.ccpayment.com/token/icon/ETH.png", "status": "Normal", "confirmations": 2, "baseUrl": "https://etherscan.io/tx/%s", "isEVM": true, "supportMemo": false },
      { "chain": "POLYGON", "chainFullName": "Polygon", "explorer": "https://polygonscan.com", "logoUrl": "https://resource.ccpayment.com/token/icon/matic.png", "status": "Normal", "confirmations": 50, "baseUrl": "https://polygonscan.com/tx/%s", "isEVM": true, "supportMemo": false }
    ]
  }
}
```

### 11.13 Get Auto-withdrawal Record List

Retrieves a list of auto-withdrawal records.

**POST** `https://ccpayment.com/ccpayment/v2/getAutoWithdrawRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | No | Coin ID |
| recordIds | Array[String] | No | CCPayment transaction IDs |
| chain | String | No | Chain symbol |
| startAt | Integer | No | Start timestamp |
| endAt | Integer | No | End timestamp |
| nextId | String | No | Pagination cursor |

**Response parameters** (`data.records[index].*`): `recordId`, `createdAt` (Integer — withdrawal creation timestamp, **13-digit Unix timestamp in milliseconds**), `coinId`, `coinSymbol`, `chain`, `orderId`, `toAddress` / `toMemo` / `txId` (blockchain withdrawals only), `amount`, `status` (`Processing` / `Success` / `Failed`), `serviceFee`, `fee` object (`coinId`, `coinSymbol`, `amount` — network fee, blockchain withdrawals only). Plus `data.nextId` for pagination (20 records per page).

### 11.14 Get Risk Refund Record List

Retrieves a list of risk refund records. Multiple query results are returned in reverse order of order-creation time.

**POST** `https://ccpayment.com/ccpayment/v2/getRiskyRefundRecordList`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| coinId | Integer | No | Coin ID |
| chain | String | No | Chain symbol |
| toAddress | String | No | Blockchain address |
| startAt | Integer | No | Start timestamp |
| endAt | Integer | No | End timestamp |
| nextId | String | No | Pagination cursor |

**Response parameters** (`data.records[index].*`): `recordId`, `coinId`, `coinSymbol`, `chain`, `toAddress`, `toMemo`, `amount`, `txId`, `status` (`Processing` / `Success` / `Failed`), `fee` object (network fee), `createdAt`, and `fromDeposit` (Array — **risk-refund associated deposit list**, each entry containing the `recordId` of the risky deposit transaction). Plus `data.nextId` for pagination.

**Note**: once the risk asset refund is successful, the system deducts **the risk refund fee and the corresponding order service fee** from the merchant's asset account.

---

## 12. Support — FAQ & Contact

### FAQ: Which deposit interface should I use for my business?

**1. Deposit by orders**
- Industry: e-commerce, product-related business. Deposits are linked to orders and have a fixed-amount requirement.
- The order deposit address has a valid time. After the order expires, the merchant still receives deposits to this address for 7 days.
- API documentation: Create Deposit Address for Order (Sections 7.2 / 7.4).

**2. Deposit by permanent addresses**
- Industry: gaming, streaming, social platforms. Deposits are linked to users with no fixed-amount requirement.
- The deposit address is assigned to one user. After assignment, users can save the deposit address and pay to it anytime. Whenever there is a payment to the address, the merchant's server receives a notification.
- API documentation: Get Permanent Deposit Address (Section 7.1).

Contact your account manager for more details.

### Contact Us

- Telegram support: https://t.me/CCPaymentSupportBot
- E-mail: support@ccpayment.com

---

## 13. Status Codes & Error Codes

### Response Format

All API responses use this structure:

```json
{ "code": 10000, "msg": "success", "data": { } }
```

### Status Codes

| Status code | Tip | Description |
|-------------|-----|-------------|
| 10000 | Success | The request has been successfully processed, and the system has returned the required information |
| 10001 | Failed | Request failed. Refer to the detailed error message to adjust your request or resolve the issue |

### Common Errors

| Error code | Error tip | Description |
|------------|-----------|-------------|
| 11000 | InvalidArgument | Invalid argument |
| 11001 | HeaderInvalidArgument | Invalid argument in header |
| 11002 | Internal | Server-side problem. Try again later or report to the support team |
| 11003 | NotFound | Data does not exist |
| 11004 | RateLimit | Reached the rate limit. Reduce the frequency of your requests |
| 11005 | VerifySignFailed | Signature verification failed |
| 11006 | ReqExpired | Request has expired |
| 11007 | RepeatedSubmit | Repeated submission |
| 11008 | QueryDurationTooMax | Query time range cannot be too large |
| 11009 | ReqDailyLimit | Exceeded daily request limit |
| 11010 | QueryNumMax | The number of transactions queried is too large. Maximum: 100 |
| 11011 | OrderDuplicate | Order ID is repeated |
| 11012 | ExpiredAtTooMax | The maximum valid period is 10 days |
| 11013 | NoSupportVersion | This account can only access the Version 1 interface |
| 11014 | MaliciousReq | Malicious request; this IP has been banned |
| 11015 | UserIdNotFound | userId does not exist |
| 11018 | Too Many Requests | To avoid concurrent conflicts in batch withdrawal operations, the system employs locking mechanisms and request queuing. This error can arise when a cancellation is attempted during order processing, or when sub-orders are concurrently being appended |

### Account Errors

| Error code | Error tip | Description |
|------------|-----------|-------------|
| 12000 | MerchantDisabled | Merchant account disabled |
| 12001 | MerchantNotFound | Merchant does not exist |
| 12002 | IpNotInWhitelist | IP not in whitelist — check the IP whitelist settings on the developer page |
| 12003 | MerchantApiDisabled | Go to the dashboard to complete website verification |

### Token Errors

| Error code | Error tip | Description |
|------------|-----------|-------------|
| 13000 | InvalidCoin | Unsupported coin |
| 13001 | InvalidChain | Unsupported network for this token |
| 13002 | AbnormalCoinPrice | Abnormal coin price |
| 13003 | AbnormalCoinPriceNotSupportMode | Abnormal coin price; only supports merchants paying network fees |
| 13004 | UnstableBlockchain | Unstable blockchain. Withdrawal of this coin is not available; try later |

### Withdrawal Errors

| Error code | Error tip | Description |
|------------|-----------|-------------|
| 14000 | BalanceInsufficient | Not enough balance for withdrawal |
| 14001 | WithdrawFeeTooLow | Withdrawal network fee too low. Check the real-time fee via the network fee interface |
| 14002 | AddressNotActive | Invalid/inactive receiving address — check if the address is valid |
| 14003 | AddressEmptyMemo | Memo for this chain cannot be empty |
| 14004 | ChainStopWithdraw | Withdrawals on this chain temporarily suspended |
| 14005 | WithdrawValueLessThanLimit | Below the minimum withdrawal limit. Check the limit via Get Token List |
| 14006 | WithdrawValueMoreThanLimit | Exceeds the maximum withdrawal limit |
| 14007 | WithdrawAddrFormat | Incorrect withdrawal address format |
| 14008 | WithdrawCannotSelf | Cannot withdraw to your own CCPayment address |
| 14009 | CoinNoSupportMemo | This coin does not support memo |
| 14010 | NoSupportCoin | Merchant does not support this token. Check merchant settings or Get Token List |
| 14011 | WithdrawFeeBalanceNotEnough | Insufficient native token for paying the network fee |
| 14012 | NotSupportMerchantTransfer | Transfer by merchant account ID is only supported between main account and sub-accounts |
| 14013 | CoinPrecisionLimit | Exceeded coin precision limit |
| 14014 | NotFinishCollection | Unpaid asset-aggregation fees. See details on your dashboard and deposit USDT to pay the outstanding balance |
| 14015 | WithdrawToContractAddress | Cannot withdraw to contract addresses |
| 14016 | WithdrawInvalidAddressType | Address type error; only transfers to data accounts are supported |
| 14025 | Invalid Memo Format | Verify that the withdrawal address memo meets the on-chain requirements |
| 14027 | Duplicate Sequence Number | Duplicate sequence numbers detected when calling the Validate Batch Withdrawal Addresses endpoint |
| 14028 | Cannot Terminate/Cancel | The current order or sub-order status does not support the terminate/cancel operation |
| 14029 | Blacklisted Address | The payout address has been blacklisted and cannot be used for payouts |

### Deposit Errors

| Error code | Error tip | Description |
|------------|-----------|-------------|
| 15000 | GenerateAddressFailed | Failed to generate address — try again |
| 15001 | PaymentAddressNumTooMuch | Available deposit addresses for this account reached the maximum limit |
| 15003 | ChainStopDeposit | Deposits for this chain are suspended |

---

## 14. Complete API Endpoint Index

All endpoints are **POST** with base URL `https://ccpayment.com/ccpayment/v2`.

| # | Category | API Name | Endpoint Path | Webhook |
|---|----------|----------|---------------|---------|
| 1 | Webhook | Resend Webhook | `/webhook/resend` | — |
| 2 | Deposit | Get Permanent Deposit Address | `/getOrCreateAppDepositAddress` | `DirectDeposit` |
| 3 | Deposit | Deposit with Merchant-Specified Currency (Create Deposit Order) | `/createAppOrderDepositAddress` | `ApiDeposit` |
| 4 | Deposit | Get Order Information (merchant-specified) | `/getAppOrderInfo` | — |
| 5 | Deposit | Deposit with Customer-Selected Currency (Create Invoice) | `/createInvoiceUrl` | `ApiDeposit` |
| 6 | Deposit | Get Order Information (customer-selected) | `/getInvoiceOrderInfo` | — |
| 7 | Deposit | Address Unbinding | `/addressUnbinding` | — |
| 8 | Deposit | Get Deposit Record | `/getAppDepositRecord` | — |
| 9 | Deposit | Get Deposit Record List | `/getAppDepositRecordList` | — |
| 10 | Withdrawal | Create Single Withdrawal Order | `/applyAppWithdrawToNetwork` | `ApiWithdrawal` |
| 11 | Withdrawal | Withdrawal to Cwallet Account | `/applyAppWithdrawToCwallet` | none (poll record) |
| 12 | Withdrawal | Get Withdrawal Record | `/getAppWithdrawRecord` | — |
| 13 | Withdrawal | Get Withdrawal Record List | `/getAppWithdrawRecordList` | — |
| 14 | Batch Withdrawal | Validate Batch Withdrawal Addresses | `/checkWithdrawAddress` | — |
| 15 | Batch Withdrawal | Initiate Batch Withdrawal | `/applyBatchWithdraw` | `ApiBatchWithdrawal` |
| 16 | Batch Withdrawal | Append Sub-orders | `/appendBatchWithdraw` | — |
| 17 | Batch Withdrawal | Confirm Batch Withdrawal | `/confirmBatchWithdraw` | `ApiBatchWithdrawal` |
| 18 | Batch Withdrawal | Terminate Batch Withdrawal | `/abortBatchWithdraw` | `ApiBatchWithdrawal` |
| 19 | Batch Withdrawal | Query Master Order Details | `/getBatchWithdrawOrder` | — |
| 20 | Batch Withdrawal | Query Sub-order Records | `/getBatchWithdrawOrderRecordList` | — |
| 21 | Swap | Get Swap Quote (merchant & user; user adds `extraFeeRate`) | `/estimate` | — |
| 22 | Swap | Create and Fulfill Swap Order | `/swap` | none (API response) |
| 23 | Swap | Get Swap Record | `/getSwapRecord` | — |
| 24 | Swap | Get Swap Record List | `/getSwapRecordList` | — |
| 25 | Wallet — Balance | Get User Balance List | `/getUserCoinAssetList` | — |
| 26 | Wallet — Balance | Get Coin Balance of Users | `/getUserCoinAsset` | — |
| 27 | Wallet — Deposit | Create or Get User Deposit Address | `/getOrCreateUserDepositAddress` | `UserDeposit` |
| 28 | Wallet — Deposit | Get User Deposit Record | `/getUserDepositRecord` | — |
| 29 | Wallet — Deposit | Get User Deposit Record List | `/getUserDepositRecordList` | — |
| 30 | Wallet — Withdrawal | User Withdrawal to Blockchain Address | `/applyUserWithdrawToNetwork` | `UserWithdrawal` |
| 31 | Wallet — Withdrawal | User Withdrawal to Cwallet Account | `/applyUserWithdrawToCwallet` | none (poll record) |
| 32 | Wallet — Withdrawal | Get User Withdrawal Record | `/getUserWithdrawRecord` | — |
| 33 | Wallet — Withdrawal | Get User Withdrawal Record List | `/getUserWithdrawRecordList` | — |
| 34 | Wallet — Internal | Create an Internal Transaction | `/userTransfer` | none (API response) |
| 35 | Wallet — Internal | Get User Internal Transaction Record | `/getUserTransferRecord` | — |
| 36 | Wallet — Internal | Get User Internal Transaction Record List | `/getUserTransferRecordList` | — |
| 37 | Wallet — Swap | Create and Fulfill User Swap Order | `/userSwap` | none (API response) |
| 38 | Wallet — Swap | Get User Swap Record | `/getUserSwapRecord` | — |
| 39 | Wallet — Swap | Get User Swap Record List | `/getUserSwapRecordList` | — |
| 40 | Common | Get Token List | `/getCoinList` | — |
| 41 | Common | Get Token Information | `/getCoin` | — |
| 42 | Common | Get Token Price | `/getCoinUSDTPrice` | — |
| 43 | Common | Get Balance List (merchant) | `/getAppCoinAssetList` | — |
| 44 | Common | Get Coin Balance (merchant) | `/getAppCoinAsset` | — |
| 45 | Common | Rescan Lost Transaction | `/rescanLostTransaction` | — |
| 46 | Common | Get Cwallet User Information | `/getCwalletUserId` | — |
| 47 | Common | Check Withdrawal Address Validity | `/checkWithdrawalAddressValidity` | — |
| 48 | Common | Get Withdrawal Network Fee | `/getWithdrawFee` | — |
| 49 | Common | Get Fiat List | `/getFiatList` | — |
| 50 | Common | Get Swap Coin List | `/getSwapCoinList` | — |
| 51 | Common | Get Chain List | `/getChainList` | — |
| 52 | Common | Get Auto-withdrawal Record List | `/getAutoWithdrawRecordList` | — |
| 53 | Common | Get Risk Refund Record List | `/getRiskyRefundRecordList` | — |

---

## 15. AI Tools & Resources

To facilitate your experience with the CCPayment API, CCPayment provides two AI features: **AI Skills** for seamless API integration and the **Ask AI** tool for instant troubleshooting.

### API Integration with AI Skills

If you regularly use AI agents for development, leverage CCPayment's pre-configured skill.md to quickly integrate the CCPayment API. Copy this prompt into your preferred AI agent:

```
Clone the https://github.com/cctip/ccpayment-sdk-skills.git repository, and then read the SKILL.md file inside it. After that, help me with CCPayment.
```

### How to Use the "Ask AI" Feature

While reading the online documentation (https://ccpayment.com/api/doc), use the built-in **Ask AI** feature in the top-right corner of the page:

- **Grok / Claude**: instantly imports the documentation context directly into Grok or Claude. Best for quick, interactive Q&A and resolving coding issues within those AI platforms.
- **Copy Markdown / View as Markdown**: exports the current documentation context into a structured format. Best when you prefer other AI models (like ChatGPT) — paste the copied markdown into your own AI tool for tailored coding assistance.

### Key Links

| Resource | URL |
|----------|-----|
| CCPayment Website | https://ccpayment.com |
| API Documentation (V2) | https://ccpayment.com/api/doc |
| Merchant Dashboard (register / APP ID & Secret / webhook / testnet / risky transactions) | https://console.ccpayment.com |
| AI Skills repository | https://github.com/cctip/ccpayment-sdk-skills |
| Telegram Support Bot | https://t.me/CCPaymentSupportBot |
| Support Email | support@ccpayment.com |

---

## Appendix: Critical Rules Checklist (for integrators & AI agents)

1. **Headers**: every request needs `Appid`, `Timestamp` (10-digit seconds, valid 2 minutes), `Sign`, and a standard `User-Agent` (missing/invalid UA → 403).
2. **Signature**: `HMAC-SHA256(appId + timestamp + bodyJSON, appSecret)` hex-encoded; the signed payload must be byte-identical to the sent payload; RSA(Base64 over SHA-256 hash) is the alternative.
3. **Webhooks are notifications only**: always verify the webhook signature, then call the corresponding Get Record / Get Order Information API before crediting anyone.
4. **Idempotency is mandatory**: deduplicate by `recordId` before processing; webhook retries (up to 6) will redeliver the same event.
5. **Respond to webhooks** with HTTP 200 and body `"Success"` (`text/plain; charset=utf-8`), otherwise CCPayment retries.
6. **Risky transactions** (`isFlaggedAsRisky: true`) are never auto-credited by CCPayment — never auto-credit them to users; handle at Dashboard > Transaction > Risky Transaction.
7. **No webhooks** for: Cwallet withdrawals, user internal transfers, swaps. Poll the respective Get Record endpoints (or rely on the synchronous API response code for transfers/swaps).
8. **Withdrawal reliability**: on network jitter/timeouts, call Get Withdrawal Record before retrying; if no Success webhook after 2 hours, proactively poll.
9. **Order deposits**: addresses accept funds for 7 days after expiration ("Overdue"); compare total paid vs. expected and classify fully paid / partially paid / overpaid / overdue before fulfilling.
10. **Batch withdrawal**: merchant balance only (not wallet-mode user balances); ≤50 sub-orders on initiate, ≤100 per append, ≤500 total; confirm within 30 minutes or the order expires; `Batch` mode cannot cancel sub-orders once Processing, `Single` mode can.
11. **Swaps**: always pass `amountOutMinimum` for slippage protection; minimum service fee is 0.1 USDT equivalent; user swaps support your own `extraFeeRate` markup credited to your merchant account.
12. **Memo-required chains** (XRP, XLM, TON, etc.): always propagate `memo`/`toMemo`; deposits without the correct memo can be lost.
13. **Address limits**: 1000 permanent addresses and 1000 user addresses per APP ID (contact customer service to raise).
14. **Webhook scope**: only coins in "Tokens for your business" trigger webhooks; whitelist webhook IP `54.150.123.157`; custom per-request `notifyUrl` requires the domain to be whitelisted first.



