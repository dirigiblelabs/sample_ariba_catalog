/* globals $ */
/* eslint-env node, dirigible */

var soap = require("net/soap");
var xml = require('utils/xml');
var request = require('net/http/request');
var response = require('net/http/response');

var search = request.getParameter("search");
if (search === null) {
	response.println("search parameter required");
	response.flush();
	response.close();
} else {
	var count = request.getParameter("count");
	
	var vrealm = "<VREALM>";
	var userId = "<USER>";
	var login = "<LOGIN>";
	var password = "<PASSWORD>";
	var server = "<SERVER>";
	var instance = "<INSTANCE>";
	
	var requestMessage = soap.createMessage();
	var part = requestMessage.getPart();
	var envelope = part.getEnvelope();
	envelope.addNamespaceDeclaration("urn", "urn:Ariba:Buyer:vrealm_" + vrealm);
	var body = envelope.getBody();
	
	var itemlmnt = body.addChildElement("WSCatalogItemSearchRequest", "urn").addChildElement("WSCatalogSearchQueryRequest_Item", "urn").addChildElement("item", "urn");
	var searchTermsItem = itemlmnt.addChildElement("SearchTerms", "urn").addChildElement("item", "urn");
	searchTermsItem.addChildElement("Field", "urn").addTextNode("MatchAll");
	searchTermsItem.addChildElement("Operator", "urn").addTextNode("like");
	searchTermsItem.addChildElement("Values", "urn").addChildElement("item", "urn").addTextNode(search);
	itemlmnt.addChildElement("Sort", "urn");
	itemlmnt.addChildElement("SortDirection", "urn");
	itemlmnt.addChildElement("UserId", "urn").addTextNode(userId);
	
	
	var mimeHeaders = requestMessage.getMimeHeaders();
	mimeHeaders.addHeader("Authorization", "Basic " + login + ":" + password);
	
	requestMessage.save();
	
	var responseMessage = soap.call(requestMessage, "https://" + server + ".ariba.com/Buyer/soap/" + instance + "/WSCatalogItemSearch");
	
	var envelopeJson = xml.toJson(responseMessage.getText());
	
	var envelopeObject = JSON.parse(envelopeJson);
	var result = [];
	
	var itemElement = envelopeObject["soap:Envelope"]["soap:Body"]["WSCatalogItemSearchReply"]["WSCatalogSearchResponse_Item"]["item"]["CatalogItems"]["item"];
	
	var resultCount = 0;
	if (Array.isArray(itemElement)) {
		for (var i=0; i<itemElement.length; i++) {
			var item = {};
			item.manufacturerPartId = itemElement[i]["ManufacturerPartId"];
			item.shortName = itemElement[i]["ShortName"];
			item.image = itemElement[i]["Image"];
			item.amount = itemElement[i]["Price"]["Amount"];
			item.currency = itemElement[i]["Price"]["Currency"];
			result.push(item);
			resultCount++;
			if (i > 11) {
				break;
			}

		}
	} else {
		var item = {};
		item.manufacturerPartId = itemElement["ManufacturerPartId"];
		item.shortName = itemElement["ShortName"];
		item.image = itemElement["Image"];
		item.ammount = itemElement["Price"]["Amount"];
		item.currency = itemElement["Price"]["Currency"];
		result.push(item);
		resultCount++;
	}
	
	
	if (count !== null) {
		response.println("12");
	} else {
		response.setContentType("text/plain; charset=UTF-8");
		response.println( JSON.stringify(result) );
	}
	response.flush();
	response.close();
	

}
