import React, { Component } from 'react';
import { Container, Table, Row, Col } from 'reactstrap';
import axios from 'axios';
import PostForm from './PostForm';

export default class App extends Component {
  state = {
    posts: []
  };

  async componentWillMount() {
    const { data: posts } = await axios.get('https://jdf85x3umd.execute-api.us-east-1.amazonaws.com/prod/getPosts?postId=*');

    this.setState({ posts });
  }

  createNewPost = async values => {
    await axios.post('https://jdf85x3umd.execute-api.us-east-1.amazonaws.com/prod/newPost', values);

    window.location.reload();
  }

  render() {
    return (
      <Container>
        <Row className="mb-2">
          <Col xs={12}>
            <h1>Serverless Text-to-Speech App</h1>
          </Col>
          <Col xs={12}>
            <p>
              This proof-of-concept is a simple app designed to take a block of text and transform it into lifelike speech.
              Currently, the languages supported are Danish, Dutch, English (Australian, British, Indian, American, Welsh),
              French, Canadian French, German, Icelandic, Italian, Japanese, Korean, Norwegian, Portuguese, Brazilian Portuguese,
              Romanian, Russian, Spanish (Castilian, American), Swedish, Turkish and Welsh.
            </p>
            <p>
              It was entirely built with <a href="https://aws.amazon.com">Amazon Web Services</a> such as API Gateway,
              DynamoDB, Lambda, SNS, Polly and S3.
            </p>
          </Col>
        </Row>
        <PostForm onSubmit={this.createNewPost} />
        <Table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Voice</th>
              <th>Sound</th>
            </tr>
          </thead>
          <tbody>
          {
            this.state.posts.map(post => (
              <tr key={post.id}>
                <td>{post.status}</td>
                <td>{post.voice}</td>
                <td>
                  <audio controls>
                    <source src={post.url} type="audio/mpeg" />
                  </audio>
                </td>
              </tr>
            ))
          }
          </tbody>
        </Table>
      </Container>
    );
  }
}
