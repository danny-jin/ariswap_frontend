import React, { Component } from "react";
import { connect } from "react-redux";
import NFTPreview from "../nft-preview/nft-preview";
import {
  axiosPostFormData,
  decimalNumberValidator,
} from "./../../utils/functions";
import { createNft } from "./../../utils/web3";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ENV } from "../../config/config";
import $ from "jquery";
import SimpleReactValidator from "simple-react-validator";
import FullPageLoader from "../../components/full-page-loader/full-page-loader";
// import {ENV} from '../../config/config'
import {
  beforeCollection,
  getCollections,
} from "../collections/collections.actions";
import { getCurrentAddress } from "../../utils/web3";
import { RiArrowDropDownLine } from "react";
import "./createNft.css";
const placeholderImg = "";

class CreateNFT extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isSubmitted: false,
      formValid: true,
      loader: true,
      errors: "",
      nft: {
        userId: ENV.getUserKeys("_id")._id,
        nftOwnerId: ENV.getUserKeys("_id")._id,
        image: "",
        name: "",
        description: "",
        currentPrice: "",
        royalty: "",
        size: "",
        copies: "",
        collectionId: "",
        ownerAddress: "",
        status: 1, // 1 = put on sale, 2 = instant sale price, 3 = unlock purchased
      },
      collections: null,
      allcollections: null,
    };
    this.validator = new SimpleReactValidator({
      autoForceUpdate: this,
      messages: {
        required: "This field is required.", // will override all messages
      },
    });
  }

  componentDidMount = async () => {
    window.scroll(0, 0);
    this.props.getCollections();
    let ownerAddress = await getCurrentAddress();

    let { nft } = this.state;
    nft = { ...nft, ownerAddress: ownerAddress };
    this.setState({
      nft,
    });
  };

  componentDidUpdate() {
    if (this.props.collection.getAuth) {
      const { collections } = this.props.collection;
      this.props.beforeCollection();
      if (!collections) {
        toast.info("Please add a collection first");
        return this.props.history.push("/collection/create");
      } else
        var myCollections = collections.filter(
          (item) => item.userId === ENV.getUserKeys("_id")._id
        );
      this.setState({
        collections: myCollections,
        loader: false,
      });
    }
  }

  onFileChange(e) {
    let file = e.target.files[0];
    let fileId = e.target.id;
    if (file)
      if (file.type.includes("image")) {
        let { nft } = this.state;
        nft = { ...nft, [e.target.name]: file };
        this.setState(
          {
            nft,
          },
          () => {
            if (file) {
              var reader = new FileReader();

              reader.onload = function (e) {
                $(`#nft-${fileId}`).attr("src", e.target.result);
                $("#nft-image-label").html("File selected");
              };
              reader.readAsDataURL(file);
            }
          }
        );
      } else {
        $(`#nft-${fileId}`).attr("src", placeholderImg);
        file = {};
      }
  }

  onChange(e, status = null) {
    let { name, value } = e.target;

    // if status is provided
    if (status) value = status;

    let { nft } = this.state;
    nft = { ...nft, [name]: value };
    this.setState({ nft });
  }

  reset = () => {
    const nft = {
      userId: ENV.getUserKeys("_id")._id,
      image: "",
      name: "",
      description: "",
      currentPrice: "",
      royalty: "",
      size: "",
      copies: "",
      collectionId: "",
      ownerAddress: this.state.ownerAddress,
      status: 1, // 1 = put on sale, 2 = instant sale price, 3 = unlock purchased
    };
    this.setState({ nft });
  };
  submit = (e) => {
    e.preventDefault();

    const { nft } = this.state;
    this.setState(
      {
        isSubmitted: true,
        formValid: this.validator.allValid() && nft.collectionId ? true : false,
      },
      () => {
        const { formValid } = this.state;
        if (formValid) {
          this.setState(
            {
              loader: true,
            },
            async () => {
              var formData = new FormData();
              for (const key in nft)
                if (nft[key]) formData.append(key, nft[key]);

              // this.props.createNFT(nft)
              const res = await axiosPostFormData(
                "nfts/create",
                formData,
                true
              );
              if (res.success) {
                this.reset();
                // toast.success(`Success! ${res.message}`)
                if (res.nft && res.nft.metaData) {
                  await createNft(res.nft.metaData, res.nft._id);
                  this.setState({
                    loader: true,
                  });
                  setTimeout(() => {
                    this.setState({ loader: false });
                    this.props.history.push("/collections");
                  }, 11000);
                }
              } else this.setState({ errors: res.message, loader: false });
            }
          );
        } else {
          this.validator.showMessages();
          this.setState(
            {
              errors: "Please fill all required fields in valid format.",
              formValid: false,
            },
            () => {
              $("#create-nft").scrollTop(0, 0);
            }
          );
        }
      }
    );
  };

  render() {
    const { nft, errors, loader, isSubmitted, collections } = this.state;
    if (!ENV.getUserKeys("_id")._id) {
      toast.error("Please login to create NFT");
      this.props.history.push("/");
      return " ";
    } else {
      return (
        <section className="author-area mt-5">
          <br />
          <br />
          {loader && <FullPageLoader />}
          <div className="container">
            <div className="row justify-content-between">
              <div className="col-12 col-md-4">
                <NFTPreview {...nft} />
              </div>
              <div className="col-12 col-md-7">
                <div className="mt-5 mt-lg-0 mb-1 mb-lg-1">
                  {/* Intro */}
                  <div className="intro">
                    <div className="intro-content">
                      <span>Get Started</span>
                      <h3 className="mt-3 mb-0">Create Item</h3>
                    </div>
                  </div>
                  {/* Form Error */}
                  {isSubmitted && errors && (
                    <div className="row">
                      <div className="col-12">
                        <span
                          id="create-nft-err"
                          className="form-error-msg text-danger"
                        >
                          {errors}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                {/* Item Form */}
                <form id="create-nft" className="item-form card no-hover">
                  {/* onClick={(e) => this.submit(e)} */}
                  <div className="row">
                    <div className="col-12">
                      <div className="input-group form-group">
                        <div className="custom-file">
                          <input
                            type="file"
                            className="custom-file-input"
                            id="image"
                            accept=".png,.jpeg,.jpg"
                            onChange={(e) => this.onFileChange(e)}
                            name="image"
                          />
                          <label
                            id="nft-image-label"
                            className="custom-file-label"
                            htmlFor="image"
                          >
                            Choose file *
                          </label>
                        </div>
                        <span className="text-danger">
                          {this.validator.message(
                            "image",
                            nft.image,
                            "required"
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group mt-3">
                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          placeholder="Item Name *"
                          required="required"
                          onChange={(e) => this.onChange(e)}
                          defaultValue={nft.name}
                        />
                        <span className="text-danger">
                          {this.validator.message("name", nft.name, "required")}
                        </span>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group">
                        <textarea
                          className="form-control"
                          name="description"
                          placeholder="Description *"
                          cols={30}
                          rows={3}
                          onChange={(e) => this.onChange(e)}
                          defaultValue={nft.description}
                        />
                        <span className="text-danger">
                          {this.validator.message(
                            "description",
                            nft.description,
                            "required"
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="form-group">
                        <input
                          type="text"
                          className="form-control"
                          name="currentPrice"
                          placeholder="Item Price *"
                          required="required"
                          onChange={(e) => this.onChange(e)}
                          onKeyDown={(e) => decimalNumberValidator(e)}
                          defaultValue={nft.currentPrice}
                        />
                        <span className="text-danger">
                          {this.validator.message(
                            "currentPrice",
                            nft.currentPrice,
                            "required"
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="form-group">
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          name="royalty"
                          placeholder="royality"
                          required="required"
                          onChange={(e) => this.onChange(e)}
                          defaultValue={nft.royalty}
                        />
                        <span className="text-danger">
                          {this.validator.message(
                            "royalty",
                            nft.royalty,
                            "required"
                          )}
                        </span>
                      </div>
                    </div>
                    {/* <div className="col-12 col-md-12">
                                        <div className="form-group">
                                            <input type="text" className="form-control" placeholder="Size (1900x1200)" required="required" name="size" onChange={(e) => this.onChange(e)} defaultValue={nft.size} />
                                        </div>
                                    </div> */}
                    <div className="col-12 col-md-6">
                      <div className="form-group">
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          name="size"
                          placeholder="Size"
                          required="required"
                          onChange={(e) => this.onChange(e)}
                          defaultValue={nft.size}
                        />
                        <span className="text-danger">
                          {this.validator.message("size", nft.size, "required")}
                        </span>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="form-group">
                        <input
                          type="number"
                          className="form-control"
                          min="0"
                          name="copies"
                          placeholder="No. of Copies *"
                          required="required"
                          onKeyDown={(e) => decimalNumberValidator(e)}
                          onChange={(e) => this.onChange(e)}
                          defaultValue={nft.copies}
                        />
                        <span className="text-danger">
                          {this.validator.message(
                            "copies",
                            nft.copies,
                            "required"
                          )}
                        </span>
                      </div>
                    </div>
                    <div className="col-12">
                      <div className="form-group select-wrapper">
                        <label htmlFor="collection">Select Collection *</label>
                        <select
                          className="form-control select-after"
                          id="collection"
                          name="collectionId"
                          onChange={(e) => this.onChange(e)}
                        >
                          <option value="">Select Collection</option>
                          {collections &&
                            collections.map((collection, index) => {
                              return (
                                <option key={index} value={collection._id}>
                                  {collection.name}
                                </option>
                              );
                            })}
                        </select>
                        <span className="text-danger">
                          {this.validator.message(
                            "collection",
                            nft.collectionId,
                            "required"
                          )}
                        </span>
                      </div>
                    </div>
                    {/* <div className="col-12">
                                        <div className="form-group mt-3">
                                            <div className="form-check form-check-inline">
                                                <input className="form-check-input" type="radio" name="status" id="putOnSale" defaultValue={1} checked={nft.status === 1 ? true : false} onChange={(e) => this.onChange(e, 1)} />
                                                <label onChange={(e) => this.onChange(e, 1)} className="form-check-label" htmlFor="putOnSale">Put on Sale</label>
                                            </div>
                                            <div className="form-check form-check-inline">
                                                <input className="form-check-input" type="radio" name="status" id="instantSalePrice" defaultValue={2} checked={nft.status === 2 ? true : false} onChange={(e) => this.onChange(e, 2)} />
                                                <label onChange={(e) => this.onChange(e, 2)} className="form-check-label" htmlFor="instantSalePrice">Instant Sale Price</label>
                                            </div>
                                            <div className="form-check form-check-inline">
                                                <input className="form-check-input" type="radio" name="status" id="unlockPurchased" defaultValue={3} checked={nft.status === 3 ? true : false} onChange={(e) => this.onChange(e, 3)} />
                                                <label onChange={(e) => this.onChange(e, 3)} className="form-check-label" htmlFor="unlockPurchased">Unlock Purchased</label>
                                            </div>
                                        </div>
                                    </div> */}
                    <div className="col-12">
                      <button
                        disabled={loader}
                        className="btn w-100 mt-3 mt-sm-4"
                        type="button"
                        onClick={(e) => this.submit(e)}
                      >
                        Create Item
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="row justify-content-center">
              <div className="col-12 col-md-12">
                <h2>My Items</h2>
              </div>
            </div>
          </div>
        </section>
      );
    }
  }
}

const mapStateToProps = (state) => ({
  error: state.error,
  collection: state.collection,
});

export default connect(mapStateToProps, { beforeCollection, getCollections })(
  CreateNFT
);
