// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract JesseTriumphNFT is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    uint256 public maxTimeDiff = 5 minutes; // допустимый интервал в 5 минут

    mapping(string => bool) private usedUUIDs;

    constructor() ERC721("JesseTriumphNFT", "JTNFT") Ownable(msg.sender) {}

    function mint(string calldata validationString, string calldata tokenURI) external {
        (uint256 timestamp, string memory uuid) = _parseValidationString(validationString);

        require(block.timestamp - timestamp <= maxTimeDiff, "Validation expired");
        require(!usedUUIDs[uuid], "UUID already used");

        usedUUIDs[uuid] = true;

        _tokenIdCounter++;
        _safeMint(msg.sender, _tokenIdCounter);
        _setTokenURI(_tokenIdCounter, tokenURI);
    }

    function _parseValidationString(string memory validationString) 
        internal 
        pure 
        returns (uint256, string memory) 
    {
        bytes memory strBytes = bytes(validationString);
        uint256 separatorIndex = 0;

        for (uint256 i = 0; i < strBytes.length - 1; i++) {
            if (strBytes[i] == bytes1("_") && strBytes[i + 1] == bytes1("_")) {
                separatorIndex = i;
                break;
            }
        }

        require(separatorIndex > 0, "Invalid validation string format");

        bytes memory timestampBytes = new bytes(separatorIndex);
        bytes memory uuidBytes = new bytes(strBytes.length - separatorIndex - 2);

        for (uint256 i = 0; i < separatorIndex; i++) {
            timestampBytes[i] = strBytes[i];
        }

        for (uint256 i = separatorIndex + 2; i < strBytes.length; i++) {
            uuidBytes[i - separatorIndex - 2] = strBytes[i];
        }

        uint256 timestamp = _stringToUint(string(timestampBytes));
        string memory uuid = string(uuidBytes);

        return (timestamp, uuid);
    }

    function _stringToUint(string memory s) internal pure returns (uint256) {
        bytes memory b = bytes(s);
        uint256 result = 0;

        for (uint256 i = 0; i < b.length; i++) {
            uint8 char = uint8(b[i]);
            require(char >= 48 && char <= 57, "Invalid character in timestamp");
            result = result * 10 + (char - 48);
        }

        return result;
    }

    function setMaxTimeDiff(uint256 newMaxTimeDiff) external onlyOwner {
        require(newMaxTimeDiff > 0, "Invalid time diff");
        maxTimeDiff = newMaxTimeDiff;
    }
}