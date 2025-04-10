// Mock axios for API calls
module.exports = {
    request: jest.fn(),
    post: jest.fn(),
    create: jest.fn(() => ({
        request: jest.fn(),
        post: jest.fn(),
    })),
};
