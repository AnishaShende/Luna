# Luna — AI-Powered Social Platform

**Luna** is an AI-driven social media platform built with **React Native** that transforms how communities interact. Designed to foster **intelligent, inclusive, and meaningful** digital communication, Luna integrates powerful AI, real-time chat, and smart filtering to enhance how users connect and communicate within groups.

---

## 🚀 Key Features

* 🤖 **AI Chat Assistant** – Gemini AI powers interactive and intelligent messaging.
* 🧠 **Smart Classification** – Filters out spam, categorizes messages by context.
* 🔍 **Interest-Based Matching** – Suggests connections using AI-generated profile embeddings.
* 📚 **Document Summarization** – Processes long messages and documents into concise summaries.
* 💬 **Real-Time Communication** – Powered by Socket.IO for instant messaging.
* 🌐 **Explore Communities** – Discover groups that align with your goals and hobbies.

---

## 🧩 Technologies Used

### 🖥️ Frontend Development

* **React Native** – Cross-platform mobile app framework for iOS and Android.

### 🧠 Backend Development

* **Node.js & Express.js** – For building scalable REST APIs and handling server-side logic.

### 💾 Database

* **MongoDB** – NoSQL database chosen for its flexibility in handling unstructured user data.

### 🔁 Real-Time Communication

* **Socket.IO** – Enables seamless, real-time messaging between users.

### 🧬 AI/ML Algorithms

* **Transformer Models**: Uses **BERT** and **MiniLM** to process profile text into meaningful vector embeddings.
* **Cosine Similarity**: Calculates similarity between users to determine best matches.
* **K-Nearest Neighbours (KNN)**: Selects top-K most relevant users based on vector similarity.
* **Threshold Filtering**: Users must meet a minimum similarity score (0.6) to be considered a relevant match.

---

## 🧪 AI Matching System

The heart of Luna’s smart social networking lies in its **AI-Powered User Matching Algorithm**:

### 🔢 Algorithm Flow:

1. **Embedding Generation**
   User profile data (interests, goals, hobbies) is embedded into a vector using `BERT` or `MiniLM`.

2. **Cosine Similarity Formula**

   $$
   \text{cosine}(A, B) = \frac{A \cdot B}{||A|| \times ||B||}
   $$

   Measures how semantically close two users are. A score of **1** indicates perfect similarity.

3. **KNN-Based Matching**
   Using the similarity scores, the top-K most similar users are selected.

4. **Threshold Filtering**
   Only users with similarity ≥ **0.6** are matched to ensure quality interactions.

---

## 🌱 Future Enhancements

To ensure Luna scales with its users and continues to innovate, we plan to:

* ☁️ **Migrate to Cloud Infrastructure** (AWS/GCP) for better scalability and reliability.
* 🌀 **Dynamic Embeddings** to reflect changing user interests.
* 🎥 **Video/Audio Chat Support** for immersive communication.
* 🛡️ **Privacy & Safety Features** like anonymous mode and report systems.
* 🎮 **Gamified Engagement** using challenges and dual-player activities.

---

## 📸 Screenshots

<details>
<summary>🔍 Click to expand</summary>

<div align="center">

🏠 **Welcome & Authentication**

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/6957c7a9-e509-4f28-8806-b40923c9890a" width="220"/><br><b>Home</b>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/3e8af740-0987-4a30-965d-7cc2313d85fa" width="220"/><br><b>Login</b>
    </td>
  </tr>
</table>

🤖 **AI-Powered Features**

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/4469a973-8c42-4944-9ea8-e56f10361933" width="220"/><br><b>AI Chat</b>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/4bead230-ad12-49bb-8c97-096ffe07526d" width="220"/><br><b>Message Classification</b>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/2e2fbc04-3be3-469d-ae2a-7fc9343c37c6" width="220"/><br><b>Advanced Filtering</b>
    </td>
  </tr>
</table>

👤 **User Experience**

<table>
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/de381f0b-7c4e-45fe-83fe-a461769a5344" width="220"/><br><b>Profile Setup</b>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/48940e10-d84d-4837-8ce3-34b473f366b9" width="220"/><br><b>Explore</b>
    </td>
  </tr>
</table>

</div>

</details>

---


# Getting Started

>**Note**: Make sure you have completed the [React Native - Environment Setup](https://reactnative.dev/docs/environment-setup) instructions till "Creating a new application" step, before proceeding.

## Step 1: Start the Metro Server

First, you will need to start **Metro**, the JavaScript _bundler_ that ships _with_ React Native.

To start Metro, run the following command from the _root_ of your React Native project:

```bash
# using npm
npm start

# OR using Yarn
yarn start
```

## Step 2: Start your Application

Let Metro Bundler run in its _own_ terminal. Open a _new_ terminal from the _root_ of your React Native project. Run the following command to start your _Android_ or _iOS_ app:

### For Android

```bash
# using npm
npm run android

# OR using Yarn
yarn android
```

### For iOS

```bash
# using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up _correctly_, you should see your new app running in your _Android Emulator_ or _iOS Simulator_ shortly provided you have set up your emulator/simulator correctly.

This is one way to run your app — you can also run it directly from within Android Studio and Xcode respectively.

## Step 3: Modifying your App

Now that you have successfully run the app, let's modify it.

1. Open `App.tsx` in your text editor of choice and edit some lines.
2. For **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Developer Menu** (<kbd>Ctrl</kbd> + <kbd>M</kbd> (on Window and Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (on macOS)) to see your changes!

   For **iOS**: Hit <kbd>Cmd ⌘</kbd> + <kbd>R</kbd> in your iOS Simulator to reload the app and see your changes!

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [Introduction to React Native](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you can't get this to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
