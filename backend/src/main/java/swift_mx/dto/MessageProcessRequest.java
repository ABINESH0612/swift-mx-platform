package swift_mx.dto;

import jakarta.validation.constraints.NotBlank;

public class MessageProcessRequest {

    @NotBlank(message = "XML content cannot be empty")
    private String xmlContent;

    public MessageProcessRequest() {}

    public MessageProcessRequest(String xmlContent) {
        this.xmlContent = xmlContent;
    }

    public String getXmlContent() {
        return xmlContent;
    }

    public void setXmlContent(String xmlContent) {
        this.xmlContent = xmlContent;
    }
}
