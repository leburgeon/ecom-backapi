import config from "./config";

// Generates a semi-personalised email confirmation, with the order number and name of the user
export const generateOrderConfirmationEmail = (orderNumber: string, name: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 5px;
            background-color: #f9f9f9;
          }
          .logo {
            text-align: center;
            margin-bottom: 20px;
          }
          .logo img {
            max-width: 150px;
          }
          .content {
            text-align: center;
          }
          .order-id {
            font-weight: bold;
            color: #555;
          }
          .footer {
            margin-top: 20px;
            font-size: 0.9em;
            color: #777;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="logo">
            <img src="${config.CLOUD_FRONT_IMAGE_BUCKET_URL}/bonbuy_logo.png" alt="Company Logo">
          </div>
          <div class="content">
            <h1>Order Confirmation</h1>
            <p>Hi ${name},</p>
            <p>Thank you for your purchase! Your order has been successfully placed.</p>
            <p>Your Order ID is: <span class="order-id">${orderNumber}</span></p>
            <p>We hope you enjoy your purchase. If you have any questions, feel free to contact us.</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};
