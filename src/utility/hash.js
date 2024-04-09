module.exports = {
    async sha256(input) {
        const { sha256 } = await import('crypto-hash');
        return await sha256(input);
    }
}