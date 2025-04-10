const mongoose = require("mongoose");
const Blacklist = require("../../src/models/Blacklist");

describe("Blacklist Model", () => {
    const mockServerId = "test-server-123";

    beforeEach(async () => {
        await Blacklist.deleteMany({});
    });

    it("should create a blacklist with default empty arrays", async () => {
        const blacklist = await Blacklist.create({ serverId: mockServerId });

        expect(blacklist.blacklistedChannels).toEqual([]);
        expect(blacklist.blacklistedLanguages).toEqual([]);
        expect(blacklist.blacklistedRoles).toEqual([]);
        expect(blacklist.blacklistedWords).toEqual([]);
    });

    it("should create a blacklist with specified values", async () => {
        const blacklistData = {
            serverId: mockServerId,
            blacklistedChannels: ["channel1", "channel2"],
            blacklistedLanguages: ["en", "es"],
            blacklistedRoles: ["role1"],
            blacklistedWords: ["word1", "word2", "word3"],
        };

        const blacklist = await Blacklist.create(blacklistData);

        expect(blacklist.blacklistedChannels).toEqual(
            blacklistData.blacklistedChannels
        );
        expect(blacklist.blacklistedLanguages).toEqual(
            blacklistData.blacklistedLanguages
        );
        expect(blacklist.blacklistedRoles).toEqual(
            blacklistData.blacklistedRoles
        );
        expect(blacklist.blacklistedWords).toEqual(
            blacklistData.blacklistedWords
        );
    });

    it("should require serverId field", async () => {
        const blacklistWithoutServerId = new Blacklist({});

        await expect(blacklistWithoutServerId.validate()).rejects.toThrow(
            "serverId"
        );
    });

    it("should update blacklist fields", async () => {
        const blacklist = await Blacklist.create({ serverId: mockServerId });

        const update = {
            blacklistedChannels: ["newChannel"],
            blacklistedLanguages: ["fr"],
            blacklistedRoles: ["newRole"],
            blacklistedWords: ["newWord"],
        };

        await Blacklist.findOneAndUpdate({ serverId: mockServerId }, update, {
            new: true,
        });

        const updated = await Blacklist.findOne({ serverId: mockServerId });
        expect(updated.blacklistedChannels).toEqual(update.blacklistedChannels);
        expect(updated.blacklistedLanguages).toEqual(
            update.blacklistedLanguages
        );
        expect(updated.blacklistedRoles).toEqual(update.blacklistedRoles);
        expect(updated.blacklistedWords).toEqual(update.blacklistedWords);
    });
});
