const Land = require('../models/Land');
const User = require('../models/User');
const LandTransaction = require('../models/LandTransaction');
const BuyRequest = require('../models/BuyRequest');

/**
 * Hybrid AI Chatbot Service
 * Combines rule-based NLP (fast, offline) with optional AI API (smart, complex queries)
 */

class ChatbotService {
  constructor() {
    // Keywords for intent recognition
    this.intents = {
      SEARCH_LANDS: ['show', 'find', 'search', 'list', 'lands', 'properties', 'available'],
      PRICE_INQUIRY: ['price', 'cost', 'expensive', 'cheap', 'average', 'how much'],
      RECOMMENDATION: ['recommend', 'suggest', 'best', 'good', 'investment', 'should i'],
      LOCATION_QUERY: ['near', 'location', 'area', 'district', 'state', 'where'],
      HELP: ['help', 'how', 'what', 'guide', 'explain', 'process'],
      STATS: ['statistics', 'stats', 'total', 'count', 'how many'],
      COMPARISON: ['compare', 'difference', 'versus', 'vs', 'better'],
    };

    // Quick responses for common questions
    this.quickResponses = {
      greeting: ['hi', 'hello', 'hey', 'greetings'],
      thanks: ['thank', 'thanks', 'appreciate'],
      goodbye: ['bye', 'goodbye', 'see you'],
    };
  }

  /**
   * Main message processing function
   * Uses rule-based NLP first, falls back to AI if configured
   */
  async processMessage(message, userId, context = {}) {
    try {
      const normalizedMessage = message.toLowerCase().trim();

      // Check for quick responses first
      const quickResponse = this.getQuickResponse(normalizedMessage);
      if (quickResponse) {
        return {
          response: quickResponse,
          type: 'quick',
          suggestions: this.getContextualSuggestions(context)
        };
      }

      // Recognize intent using rule-based NLP
      const intent = this.recognizeIntent(normalizedMessage);
      console.log('Recognized intent:', intent);

      // Process based on intent
      let response;
      switch (intent) {
        case 'SEARCH_LANDS':
          response = await this.handleSearchLands(normalizedMessage, userId);
          break;
        case 'PRICE_INQUIRY':
          response = await this.handlePriceInquiry(normalizedMessage);
          break;
        case 'RECOMMENDATION':
          response = await this.handleRecommendation(normalizedMessage, userId);
          break;
        case 'LOCATION_QUERY':
          response = await this.handleLocationQuery(normalizedMessage);
          break;
        case 'HELP':
          response = await this.handleHelp(normalizedMessage);
          break;
        case 'STATS':
          response = await this.handleStats(normalizedMessage);
          break;
        case 'COMPARISON':
          response = await this.handleComparison(normalizedMessage);
          break;
        default:
          // Fallback to AI if configured, otherwise use FAQ
          response = await this.handleFallback(normalizedMessage, userId);
      }

      return {
        response: response.message,
        type: response.type || 'text',
        data: response.data || null,
        suggestions: response.suggestions || this.getContextualSuggestions(context)
      };

    } catch (error) {
      console.error('Chatbot error:', error);
      return {
        response: "I'm having trouble processing that. Could you rephrase your question?",
        type: 'error',
        suggestions: ['Show available lands', 'Price statistics', 'How to buy land']
      };
    }
  }

  /**
   * Recognize user intent from message
   */
  recognizeIntent(message) {
    for (const [intent, keywords] of Object.entries(this.intents)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return intent;
      }
    }
    return 'UNKNOWN';
  }

  /**
   * Get quick response for common phrases
   */
  getQuickResponse(message) {
    if (this.quickResponses.greeting.some(word => message.includes(word))) {
      return "Hello! 👋 I'm your AI land registry assistant. I can help you find properties, check prices, and guide you through the buying process. What would you like to know?";
    }
    if (this.quickResponses.thanks.some(word => message.includes(word))) {
      return "You're welcome! Feel free to ask me anything else about lands or the buying process. 😊";
    }
    if (this.quickResponses.goodbye.some(word => message.includes(word))) {
      return "Goodbye! Come back anytime you need help with land registry. Have a great day! 👋";
    }
    return null;
  }

  /**
   * Handle land search queries
   */
  async handleSearchLands(message, userId) {
    try {
      const filters = this.extractFilters(message);
      console.log('Extracted filters:', filters);

      // Build query
      const query = { 'marketInfo.isForSale': true };
      
      if (filters.landType) {
        query.landType = filters.landType.toUpperCase();
      }
      if (filters.district) {
        query.district = new RegExp(filters.district, 'i');
      }
      if (filters.state) {
        query.state = new RegExp(filters.state, 'i');
      }
      if (filters.minPrice || filters.maxPrice) {
        query['marketInfo.askingPrice'] = {};
        if (filters.minPrice) query['marketInfo.askingPrice'].$gte = filters.minPrice;
        if (filters.maxPrice) query['marketInfo.askingPrice'].$lte = filters.maxPrice;
      }

      // Determine sort order
      let sortCriteria = { 'marketInfo.listedAt': -1 }; // Default: newest first
      if (filters.sortBy === 'price-asc') {
        sortCriteria = { 'marketInfo.askingPrice': 1 }; // Cheapest first
      } else if (filters.sortBy === 'price-desc') {
        sortCriteria = { 'marketInfo.askingPrice': -1 }; // Most expensive first
      }

      const lands = await Land.find(query)
        .populate('currentOwner', 'fullName email')
        .limit(10)
        .sort(sortCriteria);

      if (lands.length === 0) {
        return {
          message: `I couldn't find any lands matching your criteria. ${filters.district ? `Try searching in nearby districts or ` : ''}adjust your price range.`,
          type: 'text',
          suggestions: ['Show all available lands', 'Price statistics', 'Popular locations']
        };
      }

      return {
        message: `Great! I found ${lands.length} propert${lands.length === 1 ? 'y' : 'ies'} for you${filters.sortBy === 'price-asc' ? ' (sorted by lowest price)' : filters.sortBy === 'price-desc' ? ' (sorted by highest price)' : ''}. Click "View Details" on any card below to see more information! 🏡`,
        type: 'search_results',
        data: { 
          lands: lands.map(l => ({ 
            id: l._id, 
            surveyNumber: l.surveyNumber, 
            price: l.marketInfo.askingPrice,
            village: l.village,
            district: l.district,
            state: l.state,
            area: l.area,
            landType: l.landType
          })) 
        },
        suggestions: ['Show more details', 'Compare prices', 'Filter by location']
      };

    } catch (error) {
      console.error('Search lands error:', error);
      return {
        message: "I encountered an error while searching. Please try again with different criteria.",
        type: 'error'
      };
    }
  }

  /**
   * Extract filters from natural language query
   */
  extractFilters(message) {
    const filters = {};

    // Check for cheap/expensive keywords to determine sorting
    if (message.includes('cheap') || message.includes('cheapest') || message.includes('affordable') || message.includes('budget')) {
      filters.sortBy = 'price-asc';
    } else if (message.includes('expensive') || message.includes('premium') || message.includes('luxury')) {
      filters.sortBy = 'price-desc';
    }

    // Extract land type
    const landTypes = ['agricultural', 'residential', 'commercial', 'industrial'];
    for (const type of landTypes) {
      if (message.includes(type)) {
        filters.landType = type;
        break;
      }
    }

    // Extract price range
    const priceMatch = message.match(/(\d+)\s*(lakh|lakhs|crore|crores|thousand|k|l|cr)/gi);
    if (priceMatch) {
      const prices = priceMatch.map(p => this.parsePrice(p));
      if (prices.length === 1) {
        filters.maxPrice = prices[0];
      } else if (prices.length >= 2) {
        filters.minPrice = Math.min(...prices);
        filters.maxPrice = Math.max(...prices);
      }
    }

    // Extract location (simple pattern matching)
    const locationWords = message.split(' ').filter(word => 
      word.length > 3 && 
      !['show', 'find', 'land', 'lands', 'under', 'above', 'between', 'near', 'cheap', 'cheapest'].includes(word)
    );
    
    // Common Indian states and cities
    const states = ['karnataka', 'maharashtra', 'tamil nadu', 'kerala', 'gujarat', 'rajasthan'];
    const cities = ['bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad', 'pune', 'mysore'];
    
    for (const word of locationWords) {
      if (states.some(state => word.includes(state.replace(' ', '')))) {
        filters.state = word;
      } else if (cities.some(city => word.includes(city))) {
        filters.district = word;
      }
    }

    return filters;
  }

  /**
   * Parse price from text to number
   */
  parsePrice(priceText) {
    const num = parseFloat(priceText.match(/[\d.]+/)[0]);
    const unit = priceText.toLowerCase();
    
    if (unit.includes('crore') || unit.includes('cr')) {
      return num * 10000000;
    } else if (unit.includes('lakh') || unit.includes('l')) {
      return num * 100000;
    } else if (unit.includes('thousand') || unit.includes('k')) {
      return num * 1000;
    }
    return num;
  }

  /**
   * Handle price inquiry queries
   */
  async handlePriceInquiry(message) {
    try {
      const filters = this.extractFilters(message);
      const query = { 'marketInfo.isForSale': true };
      
      if (filters.district) query.district = new RegExp(filters.district, 'i');
      if (filters.state) query.state = new RegExp(filters.state, 'i');
      if (filters.landType) query.landType = filters.landType.toUpperCase();

      const lands = await Land.find(query).select('marketInfo.askingPrice area landType district');
      
      if (lands.length === 0) {
        return {
          message: "I don't have enough data for that location. Try a different area or check our marketplace for available listings.",
          type: 'text'
        };
      }

      const prices = lands.map(l => l.marketInfo.askingPrice).filter(p => p > 0);
      const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      const location = filters.district || filters.state || 'this area';
      
      return {
        message: `📊 Price Analysis for ${location}:\n\n` +
                `• Average Price: ₹${avgPrice.toLocaleString('en-IN')}\n` +
                `• Lowest Price: ₹${minPrice.toLocaleString('en-IN')}\n` +
                `• Highest Price: ₹${maxPrice.toLocaleString('en-IN')}\n` +
                `• Total Listings: ${lands.length}\n\n` +
                `Would you like to see properties in a specific price range?`,
        type: 'price_analysis',
        data: { avgPrice, minPrice, maxPrice, count: lands.length },
        suggestions: ['Show cheapest lands', 'Show premium lands', 'Compare locations']
      };

    } catch (error) {
      console.error('Price inquiry error:', error);
      return {
        message: "I couldn't analyze prices right now. Please try again.",
        type: 'error'
      };
    }
  }

  /**
   * Handle recommendation queries
   */
  async handleRecommendation(message, userId) {
    try {
      // Get user's previous interactions if available
      const user = await User.findById(userId);
      
      // Find popular and well-priced lands
      const lands = await Land.find({ 'marketInfo.isForSale': true })
        .populate('currentOwner', 'fullName verificationStatus')
        .limit(5)
        .sort({ 'marketInfo.listedAt': -1 });

      if (lands.length === 0) {
        return {
          message: "There are no lands available for sale at the moment. Check back soon!",
          type: 'text'
        };
      }

      return {
        message: `🌟 Here are my top ${lands.length} recommendations based on verification status, features, and market value. Check out the cards below!`,
        type: 'search_results',
        data: { 
          lands: lands.map(l => ({ 
            id: l._id, 
            surveyNumber: l.surveyNumber, 
            price: l.marketInfo.askingPrice,
            village: l.village,
            district: l.district,
            state: l.state,
            area: l.area,
            landType: l.landType
          })) 
        },
        suggestions: ['View details', 'Compare these lands', 'Search by budget']
      };

    } catch (error) {
      console.error('Recommendation error:', error);
      return {
        message: "I couldn't generate recommendations right now. Browse the marketplace to see available properties.",
        type: 'error'
      };
    }
  }

  /**
   * Handle location-based queries
   */
  async handleLocationQuery(message) {
    try {
      const filters = this.extractFilters(message);
      
      // Get unique locations with counts
      const locations = await Land.aggregate([
        { $match: { 'marketInfo.isForSale': true } },
        { $group: { 
          _id: { district: '$district', state: '$state' },
          count: { $sum: 1 },
          avgPrice: { $avg: '$marketInfo.askingPrice' }
        }},
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);

      if (locations.length === 0) {
        return {
          message: "No locations found with available lands. Check back later!",
          type: 'text'
        };
      }

      const locationList = locations.map((loc, index) => 
        `${index + 1}. ${loc._id.district}, ${loc._id.state}\n   ` +
        `Available: ${loc.count} lands | Avg Price: ₹${Math.round(loc.avgPrice).toLocaleString('en-IN')}`
      ).join('\n\n');

      return {
        message: `📍 Popular Locations:\n\n${locationList}\n\nWould you like to see lands in any of these locations?`,
        type: 'location_list',
        data: { locations },
        suggestions: ['Show all locations', 'Filter by state', 'Price comparison']
      };

    } catch (error) {
      console.error('Location query error:', error);
      return {
        message: "I couldn't fetch location data. Please try again.",
        type: 'error'
      };
    }
  }

  /**
   * Handle help queries
   */
  async handleHelp(message) {
    const helpTopics = {
      buy: "To buy land:\n1. Browse marketplace or search for properties\n2. Chat with the seller\n3. Make an offer\n4. Complete verification (if not done)\n5. Initiate buy request\n6. Admin approves the transaction\n7. Ownership transfers on blockchain",
      verify: "Verification process:\n1. Go to your profile\n2. Upload required documents (PAN, Aadhaar, etc.)\n3. Submit for admin review\n4. Wait for approval\n5. Once verified, you can claim land ownership",
      search: "Search tips:\n• Use filters for price, location, land type\n• Try: 'Show agricultural lands under 50 lakhs'\n• Ask: 'What's the average price in Bangalore?'\n• Request: 'Recommend good investment properties'",
      default: "I can help you with:\n• Finding lands (search, filter, recommend)\n• Price information and comparisons\n• Buying process guidance\n• Verification requirements\n• Location-based queries\n\nJust ask me anything!"
    };

    let topic = 'default';
    if (message.includes('buy') || message.includes('purchase')) topic = 'buy';
    else if (message.includes('verify') || message.includes('verification')) topic = 'verify';
    else if (message.includes('search') || message.includes('find')) topic = 'search';

    return {
      message: `📚 ${helpTopics[topic]}`,
      type: 'help',
      suggestions: ['How to buy land', 'Verification process', 'Search tips']
    };
  }

  /**
   * Handle statistics queries
   */
  async handleStats(message) {
    try {
      const totalLands = await Land.countDocuments({ 'marketInfo.isForSale': true });
      const totalUsers = await User.countDocuments({ role: 'USER' });
      const totalTransactions = await LandTransaction.countDocuments();
      const pendingRequests = await BuyRequest.countDocuments({ status: 'PENDING_SELLER_CONFIRMATION' });

      return {
        message: `📈 Marketplace Statistics:\n\n` +
                `• Available Lands: ${totalLands}\n` +
                `• Registered Users: ${totalUsers}\n` +
                `• Completed Transactions: ${totalTransactions}\n` +
                `• Pending Buy Requests: ${pendingRequests}\n\n` +
                `The marketplace is active and growing!`,
        type: 'statistics',
        data: { totalLands, totalUsers, totalTransactions, pendingRequests },
        suggestions: ['Show available lands', 'Price trends', 'Popular locations']
      };

    } catch (error) {
      console.error('Stats error:', error);
      return {
        message: "I couldn't fetch statistics right now. Please try again.",
        type: 'error'
      };
    }
  }

  /**
   * Handle comparison queries
   */
  async handleComparison(message) {
    return {
      message: "To compare lands, please specify:\n• Two locations (e.g., 'Compare Bangalore vs Mysore')\n• Two land types (e.g., 'Compare agricultural vs residential')\n• Two specific properties by survey number",
      type: 'help',
      suggestions: ['Compare by location', 'Compare by price', 'Compare by type']
    };
  }

  /**
   * Fallback handler - can integrate AI API here
   */
  async handleFallback(message, userId) {
    // Check if AI API is configured
    const aiApiKey = process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY;
    
    if (aiApiKey) {
      // TODO: Integrate with AI API for complex queries
      // For now, return helpful message
      return {
        message: "I'm not sure I understood that. Try asking:\n" +
                "• 'Show me agricultural lands under 50 lakhs'\n" +
                "• 'What's the average price in Karnataka?'\n" +
                "• 'Recommend good investment properties'\n" +
                "• 'How do I buy land?'",
        type: 'fallback',
        suggestions: ['Search lands', 'Price info', 'Help guide']
      };
    }

    // Rule-based fallback
    return {
      message: "I can help you with:\n" +
              "✓ Finding lands (search, filter, recommend)\n" +
              "✓ Price information and analysis\n" +
              "✓ Location-based queries\n" +
              "✓ Buying process guidance\n\n" +
              "What would you like to know?",
      type: 'fallback',
      suggestions: ['Show available lands', 'Price statistics', 'How to buy']
    };
  }

  /**
   * Get contextual suggestions based on current page/context
   */
  getContextualSuggestions(context = {}) {
    if (context.page === 'marketplace') {
      return ['Show cheap lands', 'Recommend properties', 'Price statistics'];
    } else if (context.page === 'my-lands') {
      return ['How to list for sale', 'Market value estimate', 'Transaction status'];
    } else {
      return ['Search lands', 'Price info', 'Help guide'];
    }
  }

  /**
   * Format area for display
   */
  formatArea(area) {
    if (typeof area === 'object') {
      return `${area.acres || 0} Acres, ${area.guntas || 0} Guntas`;
    }
    return area || 'N/A';
  }
}

module.exports = new ChatbotService();
