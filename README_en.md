# Smart POS Calculator

A lightweight, mobile-first web app that turns your smartphone into a simple POS: calculator + customizable product buttons.

[中文](README_zh.md) | [日本語](README_ja.md)

---

### Introduction
**Smart POS Calculator** is a lightweight, mobile-first web application designed to turn your smartphone into a simple Point of Sale (POS) system. It combines a standard calculator with customizable preset buttons, making it ideal for small businesses, stalls, and quick sales events.

### Key Features
- **Customizable Setup:** Up to **5** quick-access product buttons with custom prices and colors  
- **Multi-language Support:** English / 中文 / 日本語  
- **Smart Counting:** Automatically tracks item quantities (e.g., tap **Red** twice = 2 items)  
- **Quick Multipliers:** Dedicated **x1.1** button (tax/service charge)  
- **Cash Register Logic:** Easy change calculation with **Cash / Received** button  
- **Sales History:** Stores transaction records locally (in your browser)  
- **CSV Export:** Download sales data as CSV for Excel/Google Sheets  
- **Offline Capable:** Works without internet once loaded

### How to Use

#### 1) Using this tool
Access the URL : "https://ineihsu.github.io/pos_calculator/index.html"

#### 2) Initial Setup
1. **Language:** Select your preferred language
2. **Tutorial:** Choose whether to view a quick interactive tutorial
3. **Product Buttons:** Use the slider to choose **0–5** preset buttons
4. **Customize:**
   - Enter the **Price** for each button
   - Tap the **color circle** to open the color picker (**10 options**)
5. Tap **Start** to enter the calculator view

#### 3) Making a Sale
- **Add Items:** Tap preset buttons to add items  
  - Example: Tap **[Red]** then **[Blue]**  
- **Multi-quantity:** Tap **[Red] → × → 3 → +** to add 3 Red items  
- **Basic Math:** Use standard keys (**+ / - / ×**) for adjustments  
- **Tax/Service:** Tap **x1.1** to multiply the current total by 1.1

#### 4) Payment & Change
1. When the total is ready, tap **Cash / Received** (green)  
2. Enter the amount received (e.g., `2000`)  
3. Tap **=** (blue)  
4. The screen shows the **Change due**

#### 5) Recording
- After the transaction, the bottom-right button becomes **Record** (black)  
- Tap **Record** to save and reset for the next customer

#### 6) History & Export
- Tap **History** (top-left) to view transactions  
- Tap **Download CSV** to export  
- Tap **Settings** (top-left icon) to edit prices/colors
