const { translateText } = require("../../src/services/translateServices");
const Settings = require("../../src/models/Settings");
const axios = require("axios");

jest.mock("axios");
jest.mock("../../src/utils/utils-logger");

describe("Translation Cache Integration Tests", () => {
    const mockServerId = "test-server-123";

    beforeEach(async () => {
        jest.clearAllMocks();
        await Settings.deleteMany({});
        await Settings.create({ serverId: mockServerId });
    });

    describe("Cache Functionality", () => {
        it("should use cached translation for repeated requests", async () => {
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
                        translations: [{ translatedText: "Bonjour" }],
                    },
                },
            };

            axios.request
                .mockResolvedValueOnce(mockDetection)  // First detection
                .mockResolvedValueOnce(mockTranslation); // First translation

            // First request
            const result1 = await translateText("Hello", mockServerId);
            expect(result1.translatedText).toBe("Bonjour");
            expect(axios.request).toHaveBeenCalledTimes(2); // One for detection, one for translation

            // Second request (should use cache)
            const result2 = await translateText("Hello", mockServerId);
            expect(result2.translatedText).toBe("Bonjour");
            expect(axios.request).toHaveBeenCalledTimes(2); // No additional API calls
        });

        it("should not use cache for different target languages", async () => {
            const mockDetection1 = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };
            const mockTranslation1 = {
                data: {
                    data: {
                        translations: [{ translatedText: "Bonjour le monde" }],
                    },
                },
            };
            const mockTranslation2 = {
                data: {
                    data: {
                        translations: [{ translatedText: "Hola Mundo" }],
                    },
                },
            };

            axios.request
                .mockResolvedValueOnce(mockDetection1)  // First detection
                .mockResolvedValueOnce(mockTranslation1) // Translation to French
                .mockResolvedValueOnce(mockDetection1)  // Second detection
                .mockResolvedValueOnce(mockTranslation2); // Translation to Spanish

            // First request (to French)
            const result1 = await translateText("Hello world", mockServerId, "fr");
            expect(result1.translatedText).toBe("Bonjour le monde");

            // Second request (to Spanish)
            const result2 = await translateText("Hello world", mockServerId, "es");
            expect(result2.translatedText).toBe("Hola Mundo");

            expect(axios.request).toHaveBeenCalledTimes(4); // Two sets of API calls
        });
    });

    describe("Translation Provider Fallback", () => {
        it("should try alternative providers when primary fails", async () => {
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
                        translations: [{ translatedText: "Bonjour" }],
                    },
                },
            };

            // Mock Google Translate failure, DeepL success
            axios.request
                .mockResolvedValueOnce(mockDetection)  // Language detection
                .mockRejectedValueOnce(new Error("Google API error"))  // Google fails
                .mockResolvedValueOnce(mockTranslation); // DeepL succeeds

            const result = await translateText("Hello", mockServerId);
            expect(result.translatedText).toBe("Bonjour");
            expect(axios.request).toHaveBeenCalledTimes(3);
        });

        it("should handle all providers failing", async () => {
            const mockDetection = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };

            // Mock all providers failing
            axios.request
                .mockResolvedValueOnce(mockDetection)  // Language detection
                .mockRejectedValueOnce(new Error("Google API error"))
                .mockRejectedValueOnce(new Error("DeepL API error"))
                .mockRejectedValueOnce(new Error("LibreTranslate error"));

            await expect(translateText("Hello", mockServerId))
                .rejects
                .toThrow("All translation services failed");
        });
    });
});
