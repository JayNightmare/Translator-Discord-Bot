const {
    translateText,
    detectLanguage,
} = require("../../src/services/translateServices");
const Settings = require("../../src/models/Settings");
const Blacklist = require("../../src/models/Blacklist");
const axios = require("axios");

jest.mock("axios");
jest.mock("../../src/utils/utils-logger");

describe("Translation Service", () => {
    const mockServerId = "test-server-123";

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("detectLanguage", () => {
        it("should detect language successfully", async () => {
            const mockResponse = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };

            axios.request.mockResolvedValueOnce(mockResponse);

            const result = await detectLanguage("Hello world", mockServerId);
            expect(result.data.detections[0][0].language).toBe("en");
        });

        it("should throw error for blacklisted language", async () => {
            const mockResponse = {
                data: {
                    data: {
                        detections: [[{ language: "fr", confidence: 0.9 }]],
                    },
                },
            };

            axios.request.mockResolvedValueOnce(mockResponse);

            // Create blacklist with French blocked
            await Blacklist.create({
                serverId: mockServerId,
                blacklistedLanguages: ["fr"],
            });

            await expect(
                detectLanguage("Bonjour", mockServerId)
            ).rejects.toThrow("Blacklisted language detected: fr");
        });
    });

    describe("translateText", () => {
        it("should translate text using Google Translate", async () => {
            // Mock settings
            await Settings.create({
                serverId: mockServerId,
                languageTo: "es",
                languageFrom: "en",
            });

            // Mock language detection
            const detectResponse = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };

            // Mock translation
            const translateResponse = {
                data: {
                    data: {
                        translations: [{ translatedText: "Hola mundo" }],
                    },
                },
            };

            axios.request
                .mockResolvedValueOnce(detectResponse) // For detection
                .mockResolvedValueOnce(translateResponse); // For translation

            const result = await translateText("Hello world", mockServerId);
            expect(result.translatedText).toBe("Hola mundo");
        });

        it("should use cache for repeated translations", async () => {
            // Mock settings
            await Settings.create({
                serverId: mockServerId,
                languageTo: "es",
                languageFrom: "en",
            });

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
                        translations: [{ translatedText: "Hola mundo" }],
                    },
                },
            };

            axios.request
                .mockResolvedValueOnce(detectResponse)
                .mockResolvedValueOnce(translateResponse);

            // First translation
            await translateText("Hello world", mockServerId);

            // Second translation (should use cache)
            const result = await translateText("Hello world", mockServerId);

            expect(result.translatedText).toBe("Hola mundo");
            expect(axios.request).toHaveBeenCalledTimes(2); // Only called for first translation
        });

        it("should fallback to DeepL when Google fails", async () => {
            await Settings.create({
                serverId: mockServerId,
                languageTo: "es",
                languageFrom: "en",
            });

            const detectResponse = {
                data: {
                    data: {
                        detections: [[{ language: "en", confidence: 0.9 }]],
                    },
                },
            };

            // Mock Google failing
            axios.request
                .mockResolvedValueOnce(detectResponse)
                .mockRejectedValueOnce(new Error("Google failed"))
                .mockResolvedValueOnce({ data: { data: "Hola mundo" } }); // DeepL success

            const result = await translateText("Hello world", mockServerId);
            expect(result.translatedText).toBe("Hola mundo");
        });
    });
});
