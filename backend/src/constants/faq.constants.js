/**
 * TechStore FAQ Knowledge Base
 * 
 * This knowledge base contains essential store policies and information
 * that the AI support agent uses to answer customer questions.
 */

const TECHSTORE_FAQ = {
    storeName: "TechStore",
    storeDescription: "A modern electronics and gadgets e-commerce store specializing in laptops, smartphones, accessories, and smart home devices.",
    
    shipping: {
        title: "Shipping Policy",
        details: [
            "Free standard shipping on orders over $50",
            "Standard shipping (5-7 business days) costs $5.99 for orders under $50",
            "Available to USA, Canada, and Mexico",
            "Express shipping (2-3 business days) available for $15.99",
            "International shipping available to select countries - contact support for details",
            "Order tracking provided via email once shipped"
        ],
        summary: "We offer free standard shipping on orders over $50 to USA, Canada, and Mexico. Orders typically arrive within 5-7 business days. Express shipping is available for $15.99."
    },
    
    returns: {
        title: "Return & Refund Policy",
        details: [
            "30-day return window from date of delivery",
            "Items must be unused, in original packaging with all accessories",
            "Free returns for defective or damaged items",
            "$5.99 restocking fee for non-defective returns",
            "Refunds processed within 5-7 business days after receiving returned item",
            "Exchanges available for different size/color/model",
            "Some items (software, opened electronics) may be non-returnable - check product page"
        ],
        summary: "We accept returns within 30 days of delivery. Items must be unused and in original packaging. Refunds are processed within 5-7 business days. A $5.99 restocking fee applies to non-defective returns."
    },
    
    warranty: {
        title: "Warranty Information",
        details: [
            "1-year manufacturer's warranty on all products (standard)",
            "Extended warranty plans available for purchase:",
            "  - 2-year extended warranty: adds $29.99",
            "  - 3-year extended warranty: adds $49.99",
            "Warranty covers manufacturing defects and hardware failures",
            "Does not cover physical damage, water damage, or misuse",
            "Warranty claims can be filed through our support team",
            "Manufacturer warranty may vary by brand - check product specifications"
        ],
        summary: "All products come with a standard 1-year manufacturer's warranty covering defects and hardware failures. Extended warranty plans (2-year or 3-year) are available at checkout."
    },
    
    support: {
        title: "Customer Support",
        details: [
            "Support Hours: Monday - Friday, 9:00 AM - 6:00 PM EST",
            "Closed on weekends and major holidays",
            "Email: support@techstore.com (response within 24 hours)",
            "Live chat available during business hours (9 AM - 6 PM EST Mon-Fri)",
            "Phone: 1-800-TECH-HELP (1-800-832-4435)",
            "Help center with FAQs and troubleshooting guides: help.techstore.com",
            "Product setup guides and manuals available on product pages"
        ],
        summary: "Our support team is available Monday-Friday, 9 AM - 6 PM EST. Contact us via email (support@techstore.com), phone (1-800-TECH-HELP), or live chat during business hours."
    },
    
    payment: {
        title: "Payment Methods",
        details: [
            "Accepted credit cards: Visa, Mastercard, American Express, Discover",
            "Debit cards accepted (Visa/Mastercard debit)",
            "PayPal and PayPal Credit",
            "Apple Pay and Google Pay for mobile checkout",
            "Buy Now, Pay Later options available through Affirm and Klarna",
            "Gift cards and store credit accepted",
            "All transactions secured with 256-bit SSL encryption",
            "We do not store your full credit card information"
        ],
        summary: "We accept Visa, Mastercard, American Express, Discover, PayPal, Apple Pay, and Google Pay. Buy Now, Pay Later options available through Affirm and Klarna. All payments are secure and encrypted."
    },
    
    orderTracking: {
        title: "Order Tracking",
        details: [
            "Tracking number sent via email once order ships",
            "Track orders at techstore.com/track or through carrier website",
            "Order status updates: Processing → Shipped → Out for Delivery → Delivered",
            "Most orders ship within 1-2 business days",
            "Contact support if tracking hasn't updated in 3 business days"
        ],
        summary: "You'll receive a tracking number via email once your order ships. Track your order at techstore.com/track or directly through the carrier."
    },
    
    priceMatch: {
        title: "Price Match Guarantee",
        details: [
            "We match prices from major online retailers",
            "Must be identical product (same model, color, specifications)",
            "Competitor must have item in stock at lower price",
            "Request price match before purchase or within 7 days after",
            "Excludes marketplace sellers, auction sites, and pricing errors",
            "Contact support with competitor's URL to request price match"
        ],
        summary: "We offer a price match guarantee for identical products from major retailers. Request a price match before purchase or within 7 days after by contacting support."
    }
};

/**
 * Generate FAQ context string for AI prompts
 * Formats the FAQ data into a readable context block
 */
function generateFAQContext() {
    return `
You are a helpful customer support agent for ${TECHSTORE_FAQ.storeName}, ${TECHSTORE_FAQ.storeDescription}

Here is important store information you should use to answer customer questions:

**SHIPPING POLICY:**
${TECHSTORE_FAQ.shipping.summary}

**RETURNS & REFUNDS:**
${TECHSTORE_FAQ.returns.summary}

**WARRANTY:**
${TECHSTORE_FAQ.warranty.summary}

**CUSTOMER SUPPORT:**
${TECHSTORE_FAQ.support.summary}

**PAYMENT METHODS:**
${TECHSTORE_FAQ.payment.summary}

**ORDER TRACKING:**
${TECHSTORE_FAQ.orderTracking.summary}

**PRICE MATCH:**
${TECHSTORE_FAQ.priceMatch.summary}

IMPORTANT INSTRUCTIONS:
- Answer questions clearly and concisely using the above information
- If a customer asks about policies, refer to the specific details above
- Be friendly, professional, and helpful
- If you don't know something or it's not covered above, politely say so and suggest contacting support
- Don't make up information not provided in the knowledge base
- Keep responses conversational but accurate
`.trim();
}

module.exports = {
    TECHSTORE_FAQ,
    generateFAQContext
};
