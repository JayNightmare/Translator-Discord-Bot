const {
    translateText,
    detectLanguage,
} = require("../../src/services/translateServices");
const axios = require("axios");

jest.mock("axios");
jest.mock("../../src/utils/utils-logger");

describe("Translation Service Security", () => {
    const mockServerId = "test-server-123";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("Input Validation", () => {
        it("should handle empty text input", async () => {
            await expect(translateText("", mockServerId)).rejects.toThrow();
        });

        it("should handle extremely long text input", async () => {
            const longText = "a".repeat(10000);

            const detectResponse = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };

            const translateResponse = {
                data: {
                    data: {
                        translations: [{ translatedText: "translated" }],
                    },
                },
            };

            axios.request
                .mockResolvedValueOnce(detectResponse)
                .mockResolvedValueOnce(translateResponse);

            const result = await translateText(longText, mockServerId);
            expect(result).toBeDefined();
        });

        it("should handle special characters", async () => {
            const specialChars = '!@#$%^&*()_+<>?:"{}|';

            const detectResponse = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };

            const translateResponse = {
                data: {
                    data: {
                        translations: [{ translatedText: "translated" }],
                    },
                },
            };

            axios.request
                .mockResolvedValueOnce(detectResponse)
                .mockResolvedValueOnce(translateResponse);

            const result = await translateText(specialChars, mockServerId);
            expect(result.translatedText).toBeDefined();
        });
    });

    describe("API Security", () => {
        it("should handle API timeouts", async () => {
            axios.request.mockRejectedValueOnce(new Error("timeout"));

            await expect(
                detectLanguage("Hello", mockServerId)
            ).rejects.toThrow();
        });

        it("should handle API rate limiting", async () => {
            const rateLimitError = {
                response: {
                    status: 429,
                    data: { message: "Too Many Requests" },
                },
            };

            axios.request.mockRejectedValueOnce(rateLimitError);

            await expect(
                detectLanguage("Hello", mockServerId)
            ).rejects.toThrow();
        });

        it("should handle invalid API responses", async () => {
            const invalidResponse = {
                data: "invalid",
            };

            axios.request.mockResolvedValueOnce(invalidResponse);

            await expect(
                detectLanguage("Hello", mockServerId)
            ).rejects.toThrow();
        });
    });
});
