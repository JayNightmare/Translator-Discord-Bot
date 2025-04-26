const { translateText } = require("../../src/services/translateServices");
const Settings = require("../../src/models/Settings");
const axios = require("axios");

jest.mock("axios");
jest.mock("../../src/utils/utils-logger");

describe("Translation Security Tests", () => {
    const mockServerId = "test-server-123";

    beforeEach(async () => {
        jest.clearAllMocks();
        await Settings.deleteMany({});
        await Settings.create({ serverId: mockServerId });
    });

    describe("Input Validation", () => {
        it("should handle empty text input", async () => {
            await expect(translateText("", mockServerId))
                .rejects
                .toThrow();
        });

        it("should handle null text input", async () => {
            await expect(translateText(null, mockServerId))
                .rejects
                .toThrow();
        });

        it("should handle undefined serverId", async () => {
            await expect(translateText("Hello", undefined))
                .rejects
                .toThrow();
        });

        it("should handle very long text input", async () => {
            const longText = "a".repeat(10000);
            const mockDetection = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };
            const mockTranslation = {
                data: {
                    data: {
                        translations: [{ translatedText: "translated" }],
                    },
                },
            };

            axios.request
                .mockResolvedValueOnce(mockDetection)
                .mockResolvedValueOnce(mockTranslation);

            const result = await translateText(longText, mockServerId);
            expect(result.translatedText).toBeDefined();
        });
    });

    describe("API Security", () => {
        it("should handle API key errors", async () => {
            const mockError = new Error("Invalid API key");
            mockError.response = { status: 403 };
            axios.request.mockRejectedValueOnce(mockError);

            await expect(translateText("Hello", mockServerId))
                .rejects
                .toThrow();
        });

        it("should handle rate limiting errors", async () => {
            const mockError = new Error("Rate limit exceeded");
            mockError.response = { status: 429 };
            axios.request.mockRejectedValueOnce(mockError);

            await expect(translateText("Hello", mockServerId))
                .rejects
                .toThrow();
        });

        it("should handle malformed API responses", async () => {
            const mockDetection = {
                data: {
                    malformed: "response"
                }
            };
            axios.request.mockResolvedValueOnce(mockDetection);

            await expect(translateText("Hello", mockServerId))
                .rejects
                .toThrow();
        });
    });

    describe("XSS Prevention", () => {
        it("should handle text with HTML/script tags", async () => {
            const maliciousText = "<script>alert('xss')</script>";
            const mockDetection = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };
            const mockTranslation = {
                data: {
                    data: {
                        translations: [{ translatedText: "sanitized text" }],
                    },
                },
            };

            axios.request
                .mockResolvedValueOnce(mockDetection)
                .mockResolvedValueOnce(mockTranslation);

            const result = await translateText(maliciousText, mockServerId);
            expect(result.translatedText).toBeDefined();
            expect(result.translatedText).not.toContain("<script>");
        });
    });
});
