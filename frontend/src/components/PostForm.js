import React, { Component } from 'react';
import { Row, Col, Form, FormGroup, Label, Input, Button } from 'reactstrap';
import Select from 'react-select';
import 'react-select/dist/react-select.css';
import voices from './voices.json';

export default class PostForm extends Component {
  state = {
    voice: null,
    text: ''
  };

  handleChange = (name, value) => {
    this.setState({
      [name]: value
    });
  };

  render() {
    return (
      <Form>
        <Row className="mb-3">
          <Col xs={12}>
            <FormGroup>
              <Label for="voice">
                Voice
              </Label>
              <Select
                options={voices}
                searchable
                name="voice"
                onChange={(selected) => this.handleChange('voice', selected && selected.value)}
                value={this.state.voice}
              />
            </FormGroup>
          </Col>
          <Col xs={12}>
            <FormGroup>
              <Label for="text">
                Text
              </Label>
              <Input
                type="textarea"
                name="text"
                value={this.state.text}
                onChange={event => this.handleChange('text', event.target.value)}
              />
            </FormGroup>
          </Col>
          <Col md={{ size: '3', offset: '9' }} xs={12}>
            <Button type="button" onClick={() => this.props.onSubmit(this.state)} color="primary" block>
              Add new post
            </Button>
          </Col>
        </Row>
      </Form>
    )
  }
}
