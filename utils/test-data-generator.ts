import { faker } from "@faker-js/faker";

/**
 * TestDataGenerator provides methods to generate dynamic test data
 * for various testing scenarios
 */
export class TestDataGenerator {
  /**
   * Generate random user data
   * @returns User object with random data
   */
  static generateUser() {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    return {
      firstName,
      lastName,
      username: faker.internet.userName({ firstName, lastName }),
      email: faker.internet.email({ firstName, lastName }),
      password: faker.internet.password({ length: 12 }),
      phoneNumber: faker.phone.number(),
      address: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
    };
  }

  /**
   * Generate random payment information
   * @returns Payment object with random data
   */
  static generatePaymentInfo() {
    return {
      cardType: faker.helpers.arrayElement(["Visa", "Mastercard", "Amex"]),
      cardNumber: faker.finance.creditCardNumber(),
      cardName: faker.person.fullName(),
      expiryDate: faker.date.future().toISOString().split("T")[0],
      cvv: faker.finance.creditCardCVV(),
    };
  }

  /**
   * Generate random product data
   * @param count Number of products to generate
   * @returns Array of product objects
   */
  static generateProducts(count = 1) {
    const products = [];

    for (let i = 0; i < count; i++) {
      products.push({
        id: faker.string.uuid(),
        name: faker.commerce.productName(),
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price()),
        category: faker.commerce.department(),
        image: faker.image.url(),
        rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
        inStock: faker.datatype.boolean(),
      });
    }

    return count === 1 ? products[0] : products;
  }

  /**
   * Generate random order data
   * @returns Order object with random data
   */
  static generateOrder() {
    const productCount = faker.number.int({ min: 1, max: 5 });
    const products = this.generateProducts(productCount);
    const totalAmount = products.reduce(
      (sum, product) => sum + product.price,
      0
    );

    return {
      orderId: faker.string.uuid(),
      orderDate: faker.date.recent(),
      products,
      shippingMethod: faker.helpers.arrayElement([
        "Standard",
        "Express",
        "Next Day",
      ]),
      shippingAddress: {
        street: faker.location.streetAddress(),
        city: faker.location.city(),
        state: faker.location.state(),
        zipCode: faker.location.zipCode(),
        country: faker.location.country(),
      },
      paymentMethod: faker.helpers.arrayElement([
        "Credit Card",
        "PayPal",
        "Bank Transfer",
      ]),
      totalAmount,
      status: faker.helpers.arrayElement([
        "Processing",
        "Shipped",
        "Delivered",
        "Cancelled",
      ]),
    };
  }

  /**
   * Generate random search queries
   * @param count Number of search queries to generate
   * @returns Array of search query strings
   */
  static generateSearchQueries(count = 5) {
    const queries = [];

    for (let i = 0; i < count; i++) {
      queries.push(faker.commerce.productName());
    }

    return queries;
  }

  /**
   * Generate random review data
   * @returns Review object with random data
   */
  static generateReview() {
    return {
      reviewId: faker.string.uuid(),
      productId: faker.string.uuid(),
      userId: faker.string.uuid(),
      rating: faker.number.int({ min: 1, max: 5 }),
      title: faker.lorem.sentence(),
      comment: faker.lorem.paragraph(),
      date: faker.date.recent(),
      helpfulVotes: faker.number.int({ min: 0, max: 100 }),
      verified: faker.datatype.boolean(),
    };
  }

  /**
   * Generate random test data for specific form
   * @param formFields Array of form field names
   * @returns Object with form field data
   */
  static generateFormData(formFields: string[]) {
    const formData: Record<string, any> = {};

    for (const field of formFields) {
      // Match field name to appropriate data type
      switch (true) {
        case /name|username/.test(field.toLowerCase()):
          formData[field] = faker.person.fullName();
          break;
        case /email/.test(field.toLowerCase()):
          formData[field] = faker.internet.email();
          break;
        case /password/.test(field.toLowerCase()):
          formData[field] = faker.internet.password();
          break;
        case /phone/.test(field.toLowerCase()):
          formData[field] = faker.phone.number();
          break;
        case /address|street/.test(field.toLowerCase()):
          formData[field] = faker.location.streetAddress();
          break;
        case /city/.test(field.toLowerCase()):
          formData[field] = faker.location.city();
          break;
        case /state|province/.test(field.toLowerCase()):
          formData[field] = faker.location.state();
          break;
        case /zip|postal/.test(field.toLowerCase()):
          formData[field] = faker.location.zipCode();
          break;
        case /country/.test(field.toLowerCase()):
          formData[field] = faker.location.country();
          break;
        case /card|cc/.test(field.toLowerCase()):
          formData[field] = faker.finance.creditCardNumber();
          break;
        case /cvv|cvc/.test(field.toLowerCase()):
          formData[field] = faker.finance.creditCardCVV();
          break;
        case /date/.test(field.toLowerCase()):
          formData[field] = faker.date.recent().toISOString().split("T")[0];
          break;
        case /comment|message|description/.test(field.toLowerCase()):
          formData[field] = faker.lorem.paragraph();
          break;
        default:
          formData[field] = faker.lorem.word();
      }
    }

    return formData;
  }

  /**
   * Generate specific test data based on scenario
   * @param scenario Specific testing scenario
   * @returns Data for the specified scenario
   */
  static generateScenarioData(scenario: string) {
    switch (scenario.toLowerCase()) {
      case "checkout":
        return {
          ...this.generateUser(),
          payment: this.generatePaymentInfo(),
          cart: this.generateProducts(3),
        };
      case "registration":
        return {
          ...this.generateUser(),
          confirmPassword: faker.internet.password(),
          acceptTerms: true,
          subscribeNewsletter: faker.datatype.boolean(),
        };
      case "product_search":
        return {
          searchTerm: faker.commerce.productName(),
          filters: {
            minPrice: faker.number.int({ min: 1, max: 50 }),
            maxPrice: faker.number.int({ min: 51, max: 1000 }),
            category: faker.commerce.department(),
            rating: faker.number.int({ min: 1, max: 5 }),
          },
        };
      default:
        return this.generateUser();
    }
  }
}

// Example usage:
// const userData = TestDataGenerator.generateUser();
// const paymentInfo = TestDataGenerator.generatePaymentInfo();
// const products = TestDataGenerator.generateProducts(3);
// const orderData = TestDataGenerator.generateOrder();
// const checkoutData = TestDataGenerator.generateScenarioData('checkout');
